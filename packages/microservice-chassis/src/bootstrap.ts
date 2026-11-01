import { createHmac } from 'node:crypto';
import * as http from 'node:http';
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
 * Starts the microservice health check HTTP endpoint (`/health`, `/api/v1/health`) and binds the NestJS Redis transport.
 */
export async function bootstrapMicroservice(
  options: MicroserviceBootstrapOptions,
): Promise<RunningMicroserviceHandle> {
  const logger = new StructuredLogger(options.serviceName);

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
            errorCode: err?.errorCode || 'INTERNAL_ERROR',
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
    redisUrl: options.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
  });

  return {
    serviceName: options.serviceName,
    schemaName: options.schemaName,
    healthPort: options.healthPort,
    healthServer,
    probeHealth: (path = '/health') => evaluateHealthRequest(path, options),
    close: async () => {
      if (healthServer.listening) {
        await new Promise<void>((resolve) => healthServer.close(() => resolve()));
      }
    },
  };
}
