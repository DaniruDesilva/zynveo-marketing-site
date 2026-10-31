import {
  PgSchema,
  uuid,
  varchar,
  jsonb,
  integer,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export type OutboxEventStatus = 'PENDING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';

/**
 * Factory creating a schema-local `outbox_events` table inside a microservice's isolated `pgSchema`.
 * Polled by `OutboxRelayWorker` via `SELECT ... FOR UPDATE SKIP LOCKED` and fanned out to BullMQ queues.
 */
export const createOutboxEventsTable = <TSchema extends string>(schema: PgSchema<TSchema>) =>
  schema.table('outbox_events', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    actorUserId: uuid('actor_user_id'),
    correlationId: uuid('correlation_id'),
    eventName: varchar('event_name', { length: 120 }).notNull(),
    sourceService: varchar('source_service', { length: 80 }).notNull(),
    aggregateType: varchar('aggregate_type', { length: 80 }),
    aggregateId: uuid('aggregate_id'),
    payload: jsonb('payload').notNull(),
    status: varchar('status', { length: 20 }).default('PENDING').notNull(), // PENDING | PROCESSING | PUBLISHED | FAILED
    attempts: integer('attempts').default(0).notNull(),
    lastError: text('last_error'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  });

/**
 * Factory creating a schema-local `processed_events` idempotency inbox table inside a microservice's isolated `pgSchema`.
 * Every BullMQ event consumer inserts `event_id` inside the same database transaction as its business state mutation.
 */
export const createProcessedEventsTable = <TSchema extends string>(schema: PgSchema<TSchema>) =>
  schema.table('processed_events', {
    eventId: uuid('event_id').primaryKey(),
    tenantId: uuid('tenant_id').notNull(),
    eventName: varchar('event_name', { length: 120 }).notNull(),
    consumerService: varchar('consumer_service', { length: 80 }).notNull(),
    correlationId: uuid('correlation_id'),
    processedAt: timestamp('processed_at').defaultNow().notNull(),
  });

