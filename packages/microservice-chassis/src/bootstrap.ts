import { createHmac } from 'node:crypto';
import * as http from 'node:http';
import { DRIZZLE_POOL } from './drizzle.module';
import { OutboxRelayWorker } from './outbox.service';
import {
  BullMqEventConsumer,
  BullMqEventQueuePublisher,
  InstantiatedModuleContext,
  RedisRpcServer,
  instantiateMicroserviceModule,
  resolveQueueForSchema,
} from './redis-transport';
import { getCurrentTenantContext } from './tenant-context';

export function signJwtHmac(payload: Record<string, unknown>, secret: string): string {
  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureB64 = createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

export interface MicroserviceBootstrapOptions {
  serviceName: string;
  schemaName: string;
  healthPort: number;
  appModule: Function;
  redisUrl?: string;
  enableTransport?: boolean;
  onClose?: () => Promise<void> | void;
  httpHandler?: (req: http.IncomingMessage, res: http.ServerResponse) => Promise<boolean> | boolean;
}

export interface HealthCheckPayload {
  status: 'ok' | 'not_found';
  service?: string;
  schema?: string;
  timestamp?: string;
}

export interface RunningMicroserviceHandle {
  serviceName: string;
  schemaName: string;
  healthPort: number;
  healthServer: http.Server;
  probeHealth: (path?: string) => { statusCode: number; body: HealthCheckPayload };
  close: () => Promise<void>;
}

export class StructuredLogger {
  constructor(private readonly serviceName: string) {}

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('INFO', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('WARN', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write('ERROR', message, meta);
  }

  private write(level: string, message: string, meta?: Record<string, unknown>): void {
    const ctx = getCurrentTenantContext();
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      tenantId: ctx?.tenantId,
      correlationId: ctx?.correlationId,
      message,
      ...meta,
    };
    console.log(JSON.stringify(entry));
  }
}

export function evaluateHealthRequest(
  url: string | undefined,
  options: Pick<MicroserviceBootstrapOptions, 'serviceName' | 'schemaName'>,
): { statusCode: number; body: HealthCheckPayload } {
  const pathname = (url || '').split('?')[0];
  if (pathname === '/health' || pathname === '/healthz' || pathname === '/api/v1/health') {
    return {
      statusCode: 200,
      body: {
        status: 'ok',
        service: options.serviceName,
        schema: options.schemaName,
        timestamp: new Date().toISOString(),
      },
    };
  }
  return {
    statusCode: 404,
    body: { status: 'not_found' },
  };
}

/**
 * Starts the microservice health check HTTP endpoint (`/health`, `/api/v1/health`) and binds
 * the Redis RPC handlers, BullMQ event consumer worker, and OutboxRelayWorker.
 */
export async function bootstrapMicroservice(
  options: MicroserviceBootstrapOptions,
): Promise<RunningMicroserviceHandle> {
  const logger = new StructuredLogger(options.serviceName);
  const redisUrl = options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  const hasModuleMetadata = Boolean((options.appModule as any)?.__module__);
  const transportEnabled = options.enableTransport !== false && hasModuleMetadata;

  let moduleCtx: InstantiatedModuleContext | null = null;
  let rpcServer: RedisRpcServer | null = null;
  let bullConsumer: BullMqEventConsumer | null = null;
  let bullPublisher: BullMqEventQueuePublisher | null = null;
  let outboxWorker: OutboxRelayWorker | null = null;

  if (transportEnabled) {
    moduleCtx = await instantiateMicroserviceModule(options.appModule);

    if (moduleCtx.rpcHandlers.size > 0) {
      rpcServer = new RedisRpcServer(moduleCtx.rpcHandlers, redisUrl);
      await rpcServer.start();
    }

    const serviceQueue = resolveQueueForSchema(options.schemaName);
    if (serviceQueue && moduleCtx.eventHandlers.size > 0) {
      bullConsumer = new BullMqEventConsumer(serviceQueue, moduleCtx.eventHandlers, redisUrl);
      await bullConsumer.start();
    }

    const writeSchemas = new Set([
      'iam',
      'finance',
      'hr',
      'scm',
      'inventory',
      'manufacturing',
      'sales_crm',
    ]);
    const pool = moduleCtx.providers.get(DRIZZLE_POOL);
    if (writeSchemas.has(options.schemaName) && pool && typeof pool.connect === 'function') {
      bullPublisher = new BullMqEventQueuePublisher(redisUrl);
      outboxWorker = new OutboxRelayWorker(
        {
          withTransaction: async (fn) => {
            const client = await pool.connect();
            try {
              await client.query('BEGIN');
              const res = await fn(client);
              await client.query('COMMIT');
              return res;
            } catch (err) {
              await client.query('ROLLBACK').catch(() => {});
              throw err;
            } finally {
              client.release();
            }
          },
        },
        bullPublisher,
        {
          schemaName: options.schemaName,
          onError: (err) => {
            logger.warn('OutboxRelayWorker poll failed', {
              error: err instanceof Error ? err.message : String(err),
            });
          },
        },
      );
      outboxWorker.start();
    }
  }

  const healthServer = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-correlation-id, x-tenant-id');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const { statusCode, body } = evaluateHealthRequest(req.url, options);
    if (statusCode === 200) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
      return;
    }

    if (options.httpHandler) {
      try {
        const handled = await options.httpHandler(req, res);
        if (handled) {
          return;
        }
      } catch (err: any) {
        const errCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
        res.writeHead(errCode, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            errorCode: err?.errorCode || err?.code || 'INTERNAL_ERROR',
            message: err?.message || 'Internal Server Error',
            details: err?.details,
          }),
        );
        return;
      }
    }

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  });

  if (options.healthPort >= 0) {
    await new Promise<void>((resolve, reject) => {
      healthServer.once('error', reject);
      healthServer.listen(options.healthPort, '127.0.0.1', () => resolve());
    });
  }

  logger.info(`Microservice started`, {
    schema: options.schemaName,
    healthPort: options.healthPort,
    redisUrl,
    rpcHandlersCount: moduleCtx?.rpcHandlers.size ?? 0,
    eventPatternsCount: moduleCtx?.eventHandlers.size ?? 0,
    outboxRelayActive: Boolean(outboxWorker),
  });

  return {
    serviceName: options.serviceName,
    schemaName: options.schemaName,
    healthPort: options.healthPort,
    healthServer,
    probeHealth: (path = '/health') => evaluateHealthRequest(path, options),
    close: async () => {
      outboxWorker?.stop();
      await bullConsumer?.close();
      await bullPublisher?.close();
      await rpcServer?.close();
      await moduleCtx?.closeResources();
      if (options.onClose) {
        await options.onClose();
      }
      const pool = moduleCtx?.providers.get(DRIZZLE_POOL);
      if (pool && typeof pool.end === 'function') {
        await pool.end().catch(() => {});
      }
      if (healthServer.listening) {
        await new Promise<void>((resolve) => healthServer.close(() => resolve()));
      }
    },
  };
}
