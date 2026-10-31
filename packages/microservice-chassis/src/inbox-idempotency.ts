import { EventEnvelope } from '@zynveo/contracts';
import { Injectable } from './nest-compat';
import { runWithTenantContext } from './tenant-context';

export interface IdempotentConsumerResult<TResult = void> {
  duplicate: boolean;
  result?: TResult;
}

@Injectable()
export class InboxService {
  /**
   * Executes a BullMQ event handler idempotently inside the consumer's database transaction.
   * Records `envelope.eventId` in `<schema>.processed_events` (`ON CONFLICT (event_id) DO NOTHING`).
   * If `event_id` already exists in `processed_events`, the handler is skipped and `{ duplicate: true }` is returned.
   */
  async consumeIdempotently<TPayload, TResult = void>(
    db: {
      transaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
    },
    processedEventsTable: any,
    consumerService: string,
    envelope: EventEnvelope<TPayload>,
    handler: (tx: any, payload: TPayload, envelope: EventEnvelope<TPayload>) => Promise<TResult>,
  ): Promise<IdempotentConsumerResult<TResult>> {
    return runWithTenantContext(
      {
        tenantId: envelope.tenantId,
        actorUserId: envelope.actorUserId || '00000000-0000-4000-8000-000000000000',
        correlationId: envelope.correlationId,
      },
      async () => {
        return db.transaction(async (tx: any) => {
          const inserted = await tx
            .insert(processedEventsTable)
            .values({
              eventId: envelope.eventId,
              tenantId: envelope.tenantId,
              eventName: envelope.eventName,
              consumerService,
              correlationId: envelope.correlationId ?? null,
            })
            .onConflictDoNothing()
            .returning();

          if (!inserted || inserted.length === 0) {
            return { duplicate: true };
          }

          const result = await handler(tx, envelope.payload, envelope);
          return { duplicate: false, result };
        });
      },
    );
  }
}

