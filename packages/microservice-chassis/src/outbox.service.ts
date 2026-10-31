import { randomUUID } from 'node:crypto';
import {
  ERP_EVENT_SUBSCRIPTIONS,
  ErpBullMqQueueName,
  ErpEventName,
  EventEnvelope,
} from '@zynveo/contracts';
import { Injectable } from './nest-compat';

export interface EnqueueOutboxEventParams<TPayload = unknown> {
  eventId?: string;
  eventName: ErpEventName;
  sourceService: string;
  tenantId: string;
  actorUserId?: string;
  correlationId?: string;
  aggregateType?: string;
  aggregateId?: string;
  payload: TPayload;
}

export interface OutboxRecord {
  id: string;
  tenant_id: string;
  actor_user_id: string | null;
  correlation_id: string | null;
  event_name: ErpEventName;
  source_service: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  payload: unknown;
  status: 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  attempts: number;
  last_error: string | null;
  created_at: Date | string;
}

/**
 * Pluggable durable queue publisher used by `OutboxRelayWorker` to fan out events to BullMQ queues.
 */
export interface EventQueuePublisher {
  publishToQueue(
    queueName: ErpBullMqQueueName,
    jobName: ErpEventName,
    envelope: EventEnvelope<any>,
    jobId: string,
  ): Promise<void>;
}

/**
 * In-memory BullMQ queue publisher for local testing & development when Redis is not attached.
 */
export class InMemoryEventQueuePublisher implements EventQueuePublisher {
  public readonly publishedJobs: Array<{
    queueName: ErpBullMqQueueName;
    jobName: ErpEventName;
    envelope: EventEnvelope<any>;
    jobId: string;
  }> = [];

  private readonly jobIds = new Set<string>();

  async publishToQueue(
    queueName: ErpBullMqQueueName,
    jobName: ErpEventName,
    envelope: EventEnvelope<any>,
    jobId: string,
  ): Promise<void> {
    // Emulate BullMQ jobId deduplication
    if (this.jobIds.has(jobId)) {
      return;
    }
    this.jobIds.add(jobId);
    this.publishedJobs.push({ queueName, jobName, envelope, jobId });
  }
}

@Injectable()
export class OutboxService {
  /**
   * Writes a domain event inside the caller's active Drizzle `db.transaction(async (tx) => { ... })`.
   * Guarantees atomic persistence of business state + outbox event (GEMINI.md Rule 4).
   */
  async enqueue<TPayload>(
    tx: { insert: (table: any) => { values: (val: any) => { returning: () => Promise<any[]> } } },
    outboxTable: any,
    params: EnqueueOutboxEventParams<TPayload>,
  ): Promise<{ id: string }> {
    const id = params.eventId || randomUUID();
    const [inserted] = await tx
      .insert(outboxTable)
      .values({
        id,
        tenantId: params.tenantId,
        actorUserId: params.actorUserId ?? null,
        correlationId: params.correlationId ?? randomUUID(),
        eventName: params.eventName,
        sourceService: params.sourceService,
        aggregateType: params.aggregateType ?? null,
        aggregateId: params.aggregateId ?? null,
        payload: params.payload,
        status: 'PENDING',
        attempts: 0,
      })
      .returning();

    return { id: inserted?.id ?? id };
  }
}

export interface OutboxRelayOptions {
  schemaName: string;
  maxAttempts?: number;
  batchSize?: number;
  pollIntervalMs?: number;
}

/**
 * Polls `<schema>.outbox_events` using `SELECT ... FOR UPDATE SKIP LOCKED`
 * (compatible with Supabase transaction-mode pooler :6543 and local Postgres :5433)
 * and fans out each event to its subscribing BullMQ queues from `ERP_EVENT_SUBSCRIPTIONS`.
 */
export class OutboxRelayWorker {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly maxAttempts: number;
  private readonly batchSize: number;
  private readonly pollIntervalMs: number;

  constructor(
    private readonly queryRunner: {
      withTransaction<T>(
        fn: (client: { query: (sql: string, params?: any[]) => Promise<{ rows: any[] }> }) => Promise<T>,
      ): Promise<T>;
    },
    private readonly publisher: EventQueuePublisher,
    private readonly options: OutboxRelayOptions,
  ) {
    if (!/^[a-z_]+$/.test(options.schemaName)) {
      throw new Error(`Invalid schema name for OutboxRelayWorker: ${options.schemaName}`);
    }
    this.maxAttempts = options.maxAttempts ?? 5;
    this.batchSize = options.batchSize ?? 25;
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
  }

  /**
   * Builds the exact `SELECT ... FOR UPDATE SKIP LOCKED` polling SQL query.
   */
  public getPollQuerySql(): string {
    return `SELECT id, tenant_id, actor_user_id, correlation_id, event_name, source_service, aggregate_type, aggregate_id, payload, status, attempts, last_error, created_at FROM ${this.options.schemaName}.outbox_events WHERE status = 'PENDING' AND attempts < $1 ORDER BY created_at ASC LIMIT $2 FOR UPDATE SKIP LOCKED`;
  }

  /**
   * Executes a single polling batch inside a database transaction.
   */
  async pollOnce(): Promise<{ processedCount: number; failedCount: number }> {
    return this.queryRunner.withTransaction(async (client) => {
      const { rows } = await client.query(this.getPollQuerySql(), [
        this.maxAttempts,
        this.batchSize,
      ]);

      let processedCount = 0;
      let failedCount = 0;

      for (const row of rows as OutboxRecord[]) {
        try {
          const targetQueues = ERP_EVENT_SUBSCRIPTIONS[row.event_name] || [];
          const envelope: EventEnvelope<any> = {
            eventId: row.id,
            eventName: row.event_name,
            occurredAt:
              row.created_at instanceof Date
                ? row.created_at.toISOString()
                : String(row.created_at),
            tenantId: row.tenant_id,
            actorUserId: row.actor_user_id ?? undefined,
            correlationId: row.correlation_id ?? undefined,
            sourceService: row.source_service,
            payload: row.payload,
          };

          for (const queueName of targetQueues) {
            const jobId = `${row.id}:${queueName}`;
            await this.publisher.publishToQueue(queueName, row.event_name, envelope, jobId);
          }

          await client.query(
            `UPDATE ${this.options.schemaName}.outbox_events SET status = 'PUBLISHED', published_at = now(), updated_at = now() WHERE id = $1`,
            [row.id],
          );
          processedCount++;
        } catch (err) {
          failedCount++;
          const nextAttempts = (row.attempts || 0) + 1;
          const nextStatus = nextAttempts >= this.maxAttempts ? 'FAILED' : 'PENDING';
          const errorMessage = err instanceof Error ? err.message : String(err);

          await client.query(
            `UPDATE ${this.options.schemaName}.outbox_events SET status = $2, attempts = $3, last_error = $4, updated_at = now() WHERE id = $1`,
            [row.id, nextStatus, nextAttempts, errorMessage],
          );
        }
      }

      return { processedCount, failedCount };
    });
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.pollOnce().catch(() => {});
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

