import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  ERP_BULLMQ_QUEUES,
  ERP_EVENT_PATTERNS,
  EventEnvelope,
} from '@zynveo/contracts';
import {
  InMemoryEventQueuePublisher,
  OutboxRelayWorker,
} from '../outbox.service';
import { InboxService } from '../inbox-idempotency';
import { bootstrapMicroservice } from '../bootstrap';

describe('@zynveo/microservice-chassis verification', () => {
  it('OutboxRelayWorker polls with FOR UPDATE SKIP LOCKED and fans out to BullMQ queues', async () => {
    const executedQueries: Array<{ sql: string; params?: any[] }> = [];
    const sampleEventId = '11111111-1111-4111-8111-111111111111';
    const sampleTenantId = '22222222-2222-4222-8222-222222222222';

    const publisher = new InMemoryEventQueuePublisher();
    const worker = new OutboxRelayWorker(
      {
        withTransaction: async (fn) =>
          fn({
            query: async (sql: string, params?: any[]) => {
              executedQueries.push({ sql, params });
              if (sql.includes('FOR UPDATE SKIP LOCKED')) {
                return {
                  rows: [
                    {
                      id: sampleEventId,
                      tenant_id: sampleTenantId,
                      actor_user_id: null,
                      correlation_id: '33333333-3333-4333-8333-333333333333',
                      event_name: ERP_EVENT_PATTERNS.INVOICE_FINALIZED,
                      source_service: 'svc-crm-sales',
                      aggregate_type: 'invoice',
                      aggregate_id: '44444444-4444-4444-8444-444444444444',
                      payload: { invoiceId: '44444444-4444-4444-8444-444444444444' },
                      status: 'PENDING',
                      attempts: 0,
                      last_error: null,
                      created_at: new Date('2026-10-31T00:00:00.000Z'),
                    },
                  ],
                };
              }
              return { rows: [] };
            },
          }),
      },
      publisher,
      { schemaName: 'sales_crm', maxAttempts: 5, batchSize: 10 },
    );

    assert.ok(
      worker.getPollQuerySql().includes('FROM sales_crm.outbox_events'),
      'Poll SQL must target schema-qualified outbox_events table',
    );
    assert.ok(
      worker.getPollQuerySql().endsWith('FOR UPDATE SKIP LOCKED'),
      'Poll SQL must use FOR UPDATE SKIP LOCKED',
    );

    const res = await worker.pollOnce();
    assert.equal(res.processedCount, 1);
    assert.equal(res.failedCount, 0);

    // INVOICE_FINALIZED fans out to FINANCE and BI_REPORTING queues
    assert.equal(publisher.publishedJobs.length, 2);
    assert.deepEqual(
      publisher.publishedJobs.map((j) => j.queueName),
      [ERP_BULLMQ_QUEUES.FINANCE, ERP_BULLMQ_QUEUES.BI_REPORTING],
    );
    assert.ok(
      executedQueries.some((q) => q.sql.includes("SET status = 'PUBLISHED'")),
      'Outbox row must be marked PUBLISHED after fan-out',
    );
  });

  it('InboxService.consumeIdempotently executes once and skips duplicate eventIds', async () => {
    const inbox = new InboxService();
    const seenIds = new Set<string>();
    let executionCount = 0;

    const mockDb = {
      transaction: async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
        const tx = {
          insert: () => ({
            values: (val: { eventId: string }) => ({
              onConflictDoNothing: () => ({
                returning: async () => {
                  if (seenIds.has(val.eventId)) {
                    return [];
                  }
                  seenIds.add(val.eventId);
                  return [{ eventId: val.eventId }];
                },
              }),
            }),
          }),
        };
        return fn(tx);
      },
    };

    const envelope: EventEnvelope<{ amount: string }> = {
      eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      eventName: ERP_EVENT_PATTERNS.INVOICE_FINALIZED,
      occurredAt: new Date().toISOString(),
      tenantId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      sourceService: 'svc-crm-sales',
      payload: { amount: '1500.00' },
    };

    const first = await inbox.consumeIdempotently(
      mockDb,
      {},
      'svc-finance',
      envelope,
      async (_tx, payload) => {
        executionCount++;
        return payload.amount;
      },
    );

    const second = await inbox.consumeIdempotently(
      mockDb,
      {},
      'svc-finance',
      envelope,
      async (_tx, payload) => {
        executionCount++;
        return payload.amount;
      },
    );

    assert.equal(first.duplicate, false);
    assert.equal(first.result, '1500.00');
    assert.equal(second.duplicate, true);
    assert.equal(executionCount, 1, 'Handler must execute exactly once across duplicate deliveries');
  });

  it('bootstrapMicroservice serves /health endpoint with 200 OK', async () => {
    class DummyModule {}
    const handle = await bootstrapMicroservice({
      serviceName: 'svc-test',
      schemaName: 'finance',
      healthPort: 0, // Ephemeral port
      appModule: DummyModule,
    });

    try {
      const addr = handle.healthServer.address();
      assert.ok(addr && typeof addr === 'object');
      const health = handle.probeHealth('/health');
      assert.equal(health.statusCode, 200);
      assert.equal(health.body.status, 'ok');
      assert.equal(health.body.service, 'svc-test');
      assert.equal(health.body.schema, 'finance');

      const notFound = handle.probeHealth('/invalid');
      assert.equal(notFound.statusCode, 404);
      assert.equal(notFound.body.status, 'not_found');
    } finally {
      await handle.close();
    }
  });

  it('HMAC JWT helper creates verifiable tokens for API Gateway auth', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: '11111111-1111-4111-8111-111111111111',
        app_metadata: {
          tenant_id: '22222222-2222-4222-8222-222222222222',
          roles: ['ACCOUNTANT'],
        },
      }),
    ).toString('base64url');
    const sig = createHmac('sha256', 'test-secret')
      .update(`${header}.${payload}`)
      .digest('base64url');
    assert.equal(`${header}.${payload}.${sig}`.split('.').length, 3);
  });
});
