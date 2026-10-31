import * as http from 'node:http';
import { getCurrentTenantContext } from './tenant-context';

export interface MicroserviceBootstrapOptions {
  serviceName: string;
  schemaName: string;
  healthPort: number;
  appModule: Function;
  redisUrl?: string;
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
  if (url === '/health' || url === '/healthz') {
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
 * Starts the microservice health check HTTP endpoint (`/health`) and binds the NestJS Redis transport.
 */
export async function bootstrapMicroservice(
  options: MicroserviceBootstrapOptions,
): Promise<RunningMicroserviceHandle> {
  const logger = new StructuredLogger(options.serviceName);

  const healthServer = http.createServer((req, res) => {
    const { statusCode, body } = evaluateHealthRequest(req.url, options);
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
