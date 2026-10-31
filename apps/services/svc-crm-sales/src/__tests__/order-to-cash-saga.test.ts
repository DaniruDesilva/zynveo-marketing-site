import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ERP_EVENT_PATTERNS, ERP_RPC_PATTERNS } from '@zynveo/contracts';
import { InboxService, OutboxService, RpcClientProxy } from '@zynveo/microservice-chassis';
import { CrmSalesController } from '../main';

describe('svc-crm-sales Order-to-Cash Saga Orchestrator', () => {
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const CUSTOMER_ID = '33333333-3333-4333-8333-333333333333';
  const WAREHOUSE_ID = '44444444-4444-4444-8444-444444444444';
  const PRODUCT_ID = '55555555-5555-4555-8555-555555555555';

  function createInMemorySalesDb() {
    const invoices: any[] = [];
    const invoiceLines: any[] = [];
    const outboxEvents: any[] = [];

    const tx: any = {
      select: () => ({
        from: (table: any) => ({
          where: async () => {
            const name = table?.[Symbol.for('drizzle:Name')];
            if (name === 'invoices') return invoices;
            if (name === 'invoice_lines') return invoiceLines;
            return [];
          },
        }),
      }),
      insert: (table: any) => ({
        values: (val: any) => {
          const name = table?.[Symbol.for('drizzle:Name')];
          const rows = Array.isArray(val) ? val : [val];
          const inserted = rows.map((r, i) => ({
            id: r.id || `66666666-6666-4666-8666-${String(Date.now() + i).slice(-12)}`,
            ...r,
          }));
          if (name === 'invoices') invoices.push(...inserted);
          if (name === 'invoice_lines') invoiceLines.push(...inserted);
          if (name === 'outbox_events') outboxEvents.push(...inserted);
          return {
            returning: async () => inserted,
          };
        },
      }),
      update: (table: any) => ({
        set: (updates: any) => ({
          where: async () => {
            const name = table?.[Symbol.for('drizzle:Name')];
            if (name === 'invoices' && invoices[0]) {
              Object.assign(invoices[0], updates);
            }
          },
        }),
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => cb(tx),
    };

    return {
      db: tx,
      state: { invoices, invoiceLines, outboxEvents },
    };
  }

  it('creates draft invoice with Decimal math and orchestrates Order-to-Cash saga on finalization', async () => {
    const { db, state } = createInMemorySalesDb();

    const rpcCalls: string[] = [];
    const mockRpcClient: RpcClientProxy = {
      send: async <TResponse = any>(pattern: { cmd: string }, payload: any): Promise<TResponse> => {
        rpcCalls.push(pattern.cmd);
        if (pattern.cmd === ERP_RPC_PATTERNS.FINANCE.CHECK_CUSTOMER_CREDIT.cmd) {
          return {
            approved: true,
            creditLimit: '500000.00',
            currentReceivableBalance: '0.00',
            availableCredit: '500000.00',
          } as unknown as TResponse;
        }
        if (pattern.cmd === ERP_RPC_PATTERNS.INVENTORY_WMS.ATOMIC_STOCK_DECREMENT.cmd) {
          return {
            success: true,
            totalCogsValuation: '4500.00',
            updatedBalances: [
              {
                productId: payload.items[0].productId,
                remainingQuantity: '18.0000',
                unitWacCost: '2250.00',
              },
            ],
          } as unknown as TResponse;
        }
        throw new Error(`Unexpected RPC pattern: ${pattern.cmd}`);
      },
    };

    const controller = new CrmSalesController(
      db,
      new OutboxService(),
      new InboxService(),
      mockRpcClient,
    );

    // 1. Create draft invoice: 2 units @ 5000.00 = 10000.00, 18% VAT = 1800.00 -> Total 11800.00
    const draft = await controller.createDraftInvoice({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '77777777-7777-4777-8777-777777777771',
      customerId: CUSTOMER_ID,
      warehouseId: WAREHOUSE_ID,
      currency: 'LKR',
      lines: [
        {
          productId: PRODUCT_ID,
          sku: 'CEYLON-TEA-BOPF',
          description: 'Ceylon BOPF Bulk 10kg',
          quantity: '2.0000',
          unitPrice: '5000.00',
          discountAmount: '0.00',
          taxRatePercent: '18.00',
        },
      ],
    });

    assert.equal(draft.status, 'DRAFT');
    assert.equal(draft.subtotalAmount, '10000.00');
    assert.equal(draft.taxAmount, '1800.00');
    assert.equal(draft.totalAmount, '11800.00');

    // 2. Finalize invoice (Order-to-Cash Saga)
    const finalized = await controller.finalizeInvoice({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '77777777-7777-4777-8777-777777777772',
      invoiceId: draft.invoiceId,
      warehouseId: WAREHOUSE_ID,
    });

    assert.equal(finalized.status, 'FINALIZED');
    assert.equal(finalized.grossReceivableAmount, '11800.00');
    assert.equal(finalized.totalCogsAmount, '4500.00');
    assert.deepEqual(rpcCalls, [
      ERP_RPC_PATTERNS.FINANCE.CHECK_CUSTOMER_CREDIT.cmd,
      ERP_RPC_PATTERNS.INVENTORY_WMS.ATOMIC_STOCK_DECREMENT.cmd,
    ]);
    assert.equal(state.outboxEvents.length, 1);
    assert.equal(state.outboxEvents[0].eventName, ERP_EVENT_PATTERNS.INVOICE_FINALIZED);
    assert.equal(state.outboxEvents[0].payload.totalCogsAmount, '4500.00');
  });
});
