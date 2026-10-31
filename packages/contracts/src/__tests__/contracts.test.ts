import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MoneySchema,
  QuantitySchema,
  PercentSchema,
  FinalizeInvoiceRequestSchema,
  FinalizeInvoiceSchema,
  ApproveGrnRequestSchema,
  PostJournalEntrySchema,
  ERP_EVENT_PATTERNS,
  ERP_EVENT_SUBSCRIPTIONS,
  ERP_BULLMQ_QUEUES,
} from '../index';

describe('@zynveo/contracts schema validation', () => {
  it('MoneySchema accepts up to 2 decimal places and rejects >2 decimal places', () => {
    assert.equal(MoneySchema.safeParse('1250.50').success, true);
    assert.equal(MoneySchema.safeParse('0').success, true);
    assert.equal(MoneySchema.safeParse('-45.25').success, true);
    assert.equal(MoneySchema.safeParse('10.1234').success, false);
    assert.equal(MoneySchema.safeParse('abc').success, false);
  });

  it('QuantitySchema accepts up to 4 decimal places and rejects >4 decimal places', () => {
    assert.equal(QuantitySchema.safeParse('10.0000').success, true);
    assert.equal(QuantitySchema.safeParse('0.125').success, true);
    assert.equal(QuantitySchema.safeParse('1.12345').success, false);
  });

  it('PercentSchema enforces 0..100 range with <=2 decimal places', () => {
    assert.equal(PercentSchema.safeParse('0.00').success, true);
    assert.equal(PercentSchema.safeParse('18.50').success, true);
    assert.equal(PercentSchema.safeParse('100').success, true);
    assert.equal(PercentSchema.safeParse('100.01').success, false);
    assert.equal(PercentSchema.safeParse('-1').success, false);
  });

  it('FinalizeInvoiceRequestSchema strips/omits client-supplied prices and tenantId', () => {
    const parsed = FinalizeInvoiceRequestSchema.parse({
      warehouseId: '11111111-1111-4111-8111-111111111111',
      lines: [{ unitPrice: '0.01' }],
      tenantId: '22222222-2222-4222-8222-222222222222',
    });
    assert.deepEqual(parsed, {
      warehouseId: '11111111-1111-4111-8111-111111111111',
    });

    const rpcPayload = FinalizeInvoiceSchema.parse({
      tenantId: '22222222-2222-4222-8222-222222222222',
      actorUserId: '33333333-3333-4333-8333-333333333333',
      invoiceId: '44444444-4444-4444-8444-444444444444',
      warehouseId: '11111111-1111-4111-8111-111111111111',
    });
    assert.equal(rpcPayload.invoiceId, '44444444-4444-4444-8444-444444444444');
  });

  it('ApproveGrnRequestSchema requires receivedQty/batchNumber and applies default rejectedQty', () => {
    const parsed = ApproveGrnRequestSchema.parse({
      grnId: '11111111-1111-4111-8111-111111111111',
      purchaseOrderId: '22222222-2222-4222-8222-222222222222',
      warehouseId: '33333333-3333-4333-8333-333333333333',
      lines: [
        {
          poLineId: '44444444-4444-4444-8444-444444444444',
          productId: '55555555-5555-4555-8555-555555555555',
          receivedQty: '25.0000',
          batchNumber: 'BATCH-2026-10',
        },
      ],
    });
    assert.equal(parsed.lines[0].rejectedQty, '0.0000');
  });

  it('PostJournalEntrySchema defaults debit/credit and sourceModule', () => {
    const parsed = PostJournalEntrySchema.parse({
      tenantId: '11111111-1111-4111-8111-111111111111',
      actorUserId: '22222222-2222-4222-8222-222222222222',
      referenceNumber: 'JE-0001',
      postingDate: '2026-10-31T00:00:00.000Z',
      narration: 'Opening balance entry',
      lines: [
        {
          accountId: '33333333-3333-4333-8333-333333333333',
          accountCode: '1000',
          debit: '500.00',
        },
        {
          accountId: '44444444-4444-4444-8444-444444444444',
          accountCode: '3000',
          credit: '500.00',
        },
      ],
    });
    assert.equal(parsed.sourceModule, 'MANUAL');
    assert.equal(parsed.lines[0].credit, '0.00');
    assert.equal(parsed.lines[1].debit, '0.00');
  });

  it('ERP_EVENT_SUBSCRIPTIONS covers every event pattern and routes to BullMQ queues', () => {
    for (const eventName of Object.values(ERP_EVENT_PATTERNS)) {
      const queues = ERP_EVENT_SUBSCRIPTIONS[eventName];
      assert.ok(Array.isArray(queues) && queues.length > 0, `Missing subscription for ${eventName}`);
    }
    assert.ok(
      ERP_EVENT_SUBSCRIPTIONS[ERP_EVENT_PATTERNS.INVOICE_FINALIZED].includes(ERP_BULLMQ_QUEUES.FINANCE),
    );
  });
});

