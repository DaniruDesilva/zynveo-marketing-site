import { randomUUID } from 'node:crypto';
import { Queue, Worker } from 'bullmq';
import IORedis, { RedisOptions } from 'ioredis';
import {
  ERP_BULLMQ_QUEUES,
  ErpBullMqQueueName,
  ErpEventName,
  EventEnvelope,
  TenantContextSchema,
} from '@zynveo/contracts';
import { DynamicModule, RpcClientProxy } from './nest-compat';
import { EventQueuePublisher } from './outbox.service';
import { runWithTenantContext } from './tenant-context';
import { ErpRpcException, RpcValidationFilter } from './zod-validation.pipe';

const SCHEMA_TO_BULLMQ_QUEUE: Record<string, ErpBullMqQueueName> = {
  iam: ERP_BULLMQ_QUEUES.IAM,
  finance: ERP_BULLMQ_QUEUES.FINANCE,
  hr: ERP_BULLMQ_QUEUES.HR_PAYROLL,
  scm: ERP_BULLMQ_QUEUES.PROCUREMENT,
  inventory: ERP_BULLMQ_QUEUES.INVENTORY,
  manufacturing: ERP_BULLMQ_QUEUES.MANUFACTURING,
  sales_crm: ERP_BULLMQ_QUEUES.SALES_CRM,
  bi: ERP_BULLMQ_QUEUES.BI_REPORTING,
};

export function resolveQueueForSchema(schemaName: string): ErpBullMqQueueName | undefined {
  return SCHEMA_TO_BULLMQ_QUEUE[schemaName];
}

export function buildRedisOptions(redisUrl?: string): RedisOptions {
  const urlString = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  const parsed = new URL(urlString);
  const options: RedisOptions = {
    host: parsed.hostname || 'localhost',
    port: parsed.port ? Number(parsed.port) : 6379,
    maxRetriesPerRequest: null,
  };
  if (parsed.username) {
    options.username = decodeURIComponent(parsed.username);
  }
  if (parsed.password) {
    options.password = decodeURIComponent(parsed.password);
  }
  if (parsed.pathname && parsed.pathname.length > 1) {
    const dbNum = Number(parsed.pathname.slice(1));
    if (!Number.isNaN(dbNum)) {
      options.db = dbNum;
    }
  }
  if (parsed.protocol === 'rediss:') {
    options.tls = {};
  }
  return options;
}

async function closeRedisConnection(client: IORedis): Promise<void> {
  if (client.status === 'ready') {
    await client.quit().catch(() => {
      client.disconnect();
    });
    return;
  }
  client.disconnect();
}

interface RpcWireRequest {
  id: string;
  cmd: string;
  replyTo: string;
  payload: unknown;
}

interface RpcWireResponse {
  id: string;
  ok: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

/**
 * Real Redis Pub/Sub RPC client implementing `RpcClientProxy` (`Transport.REDIS` semantics).
 */
export class RedisRpcClient implements RpcClientProxy {
  private readonly pub: IORedis;
  private readonly sub: IORedis;
  private readonly replyChannel: string;
  private readonly timeoutMs: number;
  private readonly pending = new Map<
    string,
    {
      resolve: (val: any) => void;
      reject: (err: any) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private connectPromise: Promise<void> | null = null;
  private closed = false;

  constructor(redisUrl?: string, timeoutMs = Number(process.env.RPC_TIMEOUT_MS || 15000)) {
    const opts = { ...buildRedisOptions(redisUrl), lazyConnect: true };
    this.pub = new IORedis(opts);
    this.sub = new IORedis(opts);
    this.pub.on('error', () => {});
    this.sub.on('error', () => {});
    this.replyChannel = `zynveo:rpc:res:${randomUUID()}`;
    this.timeoutMs = timeoutMs;

    this.sub.on('message', (_channel: string, rawMessage: string) => {
      try {
        const msg = JSON.parse(rawMessage) as RpcWireResponse;
        const entry = this.pending.get(msg.id);
        if (!entry) return;
        this.pending.delete(msg.id);
        clearTimeout(entry.timer);

        if (msg.ok) {
          entry.resolve(msg.result);
        } else {
          entry.reject(
            new ErpRpcException(
              msg.error?.code || 'RPC_ERROR',
              msg.error?.message || 'Microservice RPC error',
              msg.error?.statusCode || 500,
              msg.error?.details,
            ),
          );
        }
      } catch {
        // Ignore malformed response payloads
      }
    });
  }

  async connect(): Promise<void> {
    if (this.closed) {
      throw new Error('RedisRpcClient is closed');
    }
    if (!this.connectPromise) {
      this.connectPromise = (async () => {
        try {
          await Promise.all([this.pub.connect(), this.sub.connect()]);
          await this.sub.subscribe(this.replyChannel);
        } catch (err) {
          this.connectPromise = null;
          throw err;
        }
      })();
    }
    return this.connectPromise;
  }

  async send<TResponse = any, TInput = any>(
    pattern: { cmd: string },
    payload: TInput,
  ): Promise<TResponse> {
    await this.connect();

    const id = randomUUID();
    const reqChannel = `zynveo:rpc:req:${pattern.cmd}`;
    const wireReq: RpcWireRequest = {
      id,
      cmd: pattern.cmd,
      replyTo: this.replyChannel,
      payload,
    };

    return new Promise<TResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new ErpRpcException(
            'RPC_TIMEOUT',
            `Timed out waiting for microservice response on pattern ${pattern.cmd}`,
            504,
          ),
        );
      }, this.timeoutMs);

      this.pending.set(id, { resolve, reject, timer });

      this.pub
        .publish(reqChannel, JSON.stringify(wireReq))
        .then((receivers) => {
          if (receivers === 0 && this.pending.has(id)) {
            this.pending.delete(id);
            clearTimeout(timer);
            reject(
              new ErpRpcException(
                'SERVICE_UNAVAILABLE',
                `No microservice listener registered on Redis for RPC pattern ${pattern.cmd}`,
                503,
              ),
            );
          }
        })
        .catch((err) => {
          if (this.pending.has(id)) {
            this.pending.delete(id);
            clearTimeout(timer);
            reject(
              new ErpRpcException(
                'RPC_TRANSPORT_ERROR',
                err instanceof Error ? err.message : 'Failed to publish Redis RPC request',
                503,
              ),
            );
          }
        });
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const [id, entry] of this.pending.entries()) {
      clearTimeout(entry.timer);
      entry.reject(new ErpRpcException('RPC_CLIENT_CLOSED', 'Redis RPC client shut down', 503));
      this.pending.delete(id);
    }
    await Promise.allSettled([closeRedisConnection(this.sub), closeRedisConnection(this.pub)]);
  }
}

export function createRedisRpcClient(redisUrl?: string): RedisRpcClient {
  return new RedisRpcClient(redisUrl);
}

/**
 * Redis Pub/Sub RPC server binding all `@MessagePattern` handlers for a microservice.
 */
export class RedisRpcServer {
  private readonly sub: IORedis;
  private readonly pub: IORedis;
  private readonly filter = new RpcValidationFilter();

  constructor(
    private readonly handlers: Map<string, (payload: unknown) => Promise<unknown>>,
    redisUrl?: string,
  ) {
    const opts = { ...buildRedisOptions(redisUrl), lazyConnect: true };
    this.sub = new IORedis(opts);
    this.pub = new IORedis(opts);
    this.sub.on('error', () => {});
    this.pub.on('error', () => {});
  }

  async start(): Promise<void> {
    if (this.handlers.size === 0) return;

    await Promise.all([this.sub.connect(), this.pub.connect()]);

    this.sub.on('message', async (_channel: string, rawMessage: string) => {
      let req: RpcWireRequest;
      try {
        req = JSON.parse(rawMessage) as RpcWireRequest;
      } catch {
        return;
      }

      const handler = this.handlers.get(req.cmd);
      if (!handler || !req.replyTo) {
        return;
      }

      const execWithContext = async () => {
        const p = req.payload as Record<string, unknown> | undefined;
        if (p && typeof p === 'object') {
          const parsedCtx = TenantContextSchema.safeParse({
            tenantId: p.tenantId,
            branchId: p.branchId,
            actorUserId: p.actorUserId,
            correlationId: p.correlationId || randomUUID(),
          });
          if (parsedCtx.success) {
            return runWithTenantContext(parsedCtx.data, () => handler(req.payload));
          }
        }
        return handler(req.payload);
      };

      try {
        const result = await execWithContext();
        const resp: RpcWireResponse = { id: req.id, ok: true, result };
        await this.pub.publish(req.replyTo, JSON.stringify(resp));
      } catch (err) {
        const formatted = this.filter.catch(err);
        const resp: RpcWireResponse = {
          id: req.id,
          ok: false,
          error: {
            code: formatted.error.code,
            message: formatted.error.message,
            statusCode: formatted.error.statusCode,
            details: formatted.error.details,
          },
        };
        await this.pub.publish(req.replyTo, JSON.stringify(resp));
      }
    });

    const channels = Array.from(this.handlers.keys()).map((cmd) => `zynveo:rpc:req:${cmd}`);
    await this.sub.subscribe(...channels);
  }

  async close(): Promise<void> {
    await Promise.allSettled([closeRedisConnection(this.sub), closeRedisConnection(this.pub)]);
  }
}

/**
 * Durable BullMQ Queue publisher used by `OutboxRelayWorker` in production & dev runtimes.
 */
export class BullMqEventQueuePublisher implements EventQueuePublisher {
  private readonly connection: IORedis;
  private readonly queues = new Map<ErpBullMqQueueName, Queue>();
  private connected = false;

  constructor(redisUrl?: string) {
    this.connection = new IORedis({ ...buildRedisOptions(redisUrl), lazyConnect: true });
    this.connection.on('error', () => {});
  }

  private async ensureQueue(queueName: ErpBullMqQueueName): Promise<Queue> {
    if (!this.connected) {
      await this.connection.connect();
      this.connected = true;
    }
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = new Queue(queueName, { connection: this.connection as any });
      this.queues.set(queueName, queue);
    }
    return queue;
  }

  async publishToQueue(
    queueName: ErpBullMqQueueName,
    jobName: ErpEventName,
    envelope: EventEnvelope<any>,
    jobId: string,
  ): Promise<void> {
    const queue = await this.ensureQueue(queueName);
    const safeJobId = jobId.replace(/:/g, '__');
    await queue.add(jobName, envelope, {
      jobId: safeJobId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 500,
      removeOnFail: false,
    });
  }

  async close(): Promise<void> {
    await Promise.allSettled(Array.from(this.queues.values()).map((q) => q.close()));
    this.queues.clear();
    if (this.connected) {
      await this.connection.quit().catch(() => {});
    }
  }
}

/**
 * Durable BullMQ Worker consuming domain events for a microservice's inbox queue.
 */
export class BullMqEventConsumer {
  private readonly connection: IORedis;
  private worker: Worker | null = null;

  constructor(
    private readonly queueName: ErpBullMqQueueName,
    private readonly handlers: Map<string, Array<(envelope: EventEnvelope<any>) => Promise<unknown>>>,
    redisUrl?: string,
  ) {
    this.connection = new IORedis({ ...buildRedisOptions(redisUrl), lazyConnect: true });
    this.connection.on('error', () => {});
  }

  async start(): Promise<void> {
    if (this.handlers.size === 0) return;

    await this.connection.connect();
    this.worker = new Worker(
      this.queueName,
      async (job) => {
        const envelope = job.data as EventEnvelope<any>;
        const eventName = envelope?.eventName || job.name;
        const matchingHandlers = this.handlers.get(eventName) || [];
        if (matchingHandlers.length === 0) {
          return;
        }

        const runAll = async () => {
          for (const handler of matchingHandlers) {
            await handler(envelope);
          }
        };

        if (envelope?.tenantId) {
          return runWithTenantContext(
            {
              tenantId: envelope.tenantId,
              actorUserId: envelope.actorUserId || '00000000-0000-4000-8000-000000000000',
              correlationId: envelope.correlationId || randomUUID(),
            },
            runAll,
          );
        }

        return runAll();
      },
      {
        connection: this.connection as any,
        concurrency: Number(process.env.BULLMQ_CONCURRENCY || 5),
      },
    );
  }

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close().catch(() => {});
      this.worker = null;
    }
    await this.connection.quit().catch(() => {});
  }
}

export interface InstantiatedModuleContext {
  providers: Map<any, any>;
  rpcHandlers: Map<string, (payload: unknown) => Promise<unknown>>;
  eventHandlers: Map<string, Array<(envelope: EventEnvelope<any>) => Promise<unknown>>>;
  closeResources: () => Promise<void>;
}

/**
 * Resolves `@Module`, `@Inject`, `@MessagePattern`, and `@EventPattern` metadata into live instances.
 */
export async function instantiateMicroserviceModule(
  appModule: Function,
): Promise<InstantiatedModuleContext> {
  const visitedModules = new Set<any>();
  const providerDefs = new Map<any, any>();
  const controllers: Function[] = [];

  const collectModule = (modOrDyn: Function | DynamicModule) => {
    if (!modOrDyn) return;
    const isDynamic = typeof modOrDyn === 'object' && 'module' in modOrDyn;
    const modClass = isDynamic ? (modOrDyn as DynamicModule).module : modOrDyn;
    const meta = isDynamic ? (modOrDyn as DynamicModule) : (modClass as any)?.__module__;

    if (!isDynamic && visitedModules.has(modClass)) return;
    visitedModules.add(modClass);

    if (!meta) return;

    for (const imp of meta.imports || []) {
      collectModule(imp);
    }
    for (const prov of meta.providers || []) {
      if (typeof prov === 'function') {
        providerDefs.set(prov, { provide: prov, useClass: prov });
      } else if (prov && typeof prov === 'object' && 'provide' in prov) {
        providerDefs.set(prov.provide, prov);
      }
    }
    for (const ctrl of meta.controllers || []) {
      if (!controllers.includes(ctrl)) {
        controllers.push(ctrl);
      }
    }
  };

  collectModule(appModule);

  const resolvedProviders = new Map<any, any>();

  const resolveToken = (token: any): any => {
    if (resolvedProviders.has(token)) {
      return resolvedProviders.get(token);
    }

    const def = providerDefs.get(token);
    if (!def) {
      if (typeof token === 'function') {
        const instance = instantiateClass(token);
        resolvedProviders.set(token, instance);
        return instance;
      }
      return undefined;
    }

    let value: any;
    if ('useValue' in def) {
      value = def.useValue;
    } else if ('useFactory' in def) {
      const args = (def.inject || []).map((dep: any) => resolveToken(dep));
      value = def.useFactory(...args);
    } else {
      const targetClass = def.useClass || def.provide;
      value = instantiateClass(targetClass);
    }

    resolvedProviders.set(token, value);
    return value;
  };

  const instantiateClass = (cls: Function): any => {
    const paramTypes: any[] =
      typeof Reflect !== 'undefined' && typeof (Reflect as any).getMetadata === 'function'
        ? (Reflect as any).getMetadata('design:paramtypes', cls) || []
        : [];
    const injectList: Array<{ parameterIndex?: number; token: any }> = (cls as any).__inject__ || [];
    const paramCount = Math.max(
      cls.length,
      paramTypes.length,
      ...injectList.map((i) => (typeof i.parameterIndex === 'number' ? i.parameterIndex + 1 : 0)),
    );

    const args: any[] = [];
    for (let idx = 0; idx < paramCount; idx++) {
      const explicitInject = injectList.find((i) => i.parameterIndex === idx);
      const token = explicitInject ? explicitInject.token : paramTypes[idx];
      args.push(token ? resolveToken(token) : undefined);
    }

    return new (cls as any)(...args);
  };

  for (const token of providerDefs.keys()) {
    resolveToken(token);
  }

  const rpcHandlers = new Map<string, (payload: unknown) => Promise<unknown>>();
  const eventHandlers = new Map<
    string,
    Array<(envelope: EventEnvelope<any>) => Promise<unknown>>
  >();

  for (const ctrlClass of controllers) {
    const instance = instantiateClass(ctrlClass);
    const proto = ctrlClass.prototype;
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;
      const fn = proto[key];
      if (typeof fn !== 'function') continue;

      const msgPattern = fn.__message_pattern__;
      if (msgPattern) {
        const cmd = typeof msgPattern === 'string' ? msgPattern : msgPattern.cmd;
        if (cmd) {
          rpcHandlers.set(cmd, (payload: unknown) => fn.call(instance, payload));
        }
      }

      const eventPatterns: string[] = Array.isArray(fn.__event_patterns__)
        ? fn.__event_patterns__
        : fn.__event_pattern__
          ? [fn.__event_pattern__]
          : [];
      for (const evtName of eventPatterns) {
        const existing = eventHandlers.get(evtName) || [];
        existing.push((envelope: EventEnvelope<any>) => fn.call(instance, envelope));
        eventHandlers.set(evtName, existing);
      }
    }
  }

  const closeResources = async () => {
    for (const val of resolvedProviders.values()) {
      if (val && typeof val.close === 'function') {
        await val.close().catch(() => {});
      }
    }
  };

  return {
    providers: resolvedProviders,
    rpcHandlers,
    eventHandlers,
    closeResources,
  };
}
