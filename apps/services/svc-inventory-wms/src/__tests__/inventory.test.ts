import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ERP_EVENT_PATTERNS } from '@zynveo/contracts';
import { InboxService, OutboxService } from '@zynveo/microservice-chassis';
import { InventoryWmsController } from '../main';

describe('svc-inventory-wms WAC, FEFO Batch Allocation & Immutable Stock Ledger', () => {
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const WAREHOUSE_ID = '33333333-3333-4333-8333-333333333333';
  const PRODUCT_ID = '44444444-4444-4444-8444-444444444444';
  const REF_DOC_1 = '55555555-5555-4555-8555-555555555551';
  const REF_DOC_2 = '55555555-5555-4555-8555-555555555552';
  const REF_DOC_3 = '55555555-5555-4555-8555-555555555553';

  function createInMemoryInventoryDb() {
    const stockLevels: any[] = [];
    const stockMovements: any[] = [];
    const batchesLots: any[] = [];
    const outboxEvents: any[] = [];

    const tx: any = {
      select: () => ({
        from: (table: any) => ({
          where: async () => {
            const name = table?.[Symbol.for('drizzle:Name')];
            if (name === 'stock_levels') return stockLevels;
            if (name === 'batches_lots') return batchesLots;
            return [];
          },
        }),
      }),
      insert: (table: any) => ({
        values: (val: any) => {
          const name = table?.[Symbol.for('drizzle:Name')];
          const rows = Array.isArray(val) ? val : [val];
          const inserted = rows.map((r, i) => ({
            id: r.id || `00000000-0000-4000-8000-${String(Date.now() + i).slice(-12)}`,
            reorderThreshold: '10.0000',
            ...r,
          }));
          if (name === 'stock_levels') stockLevels.push(...inserted);
          if (name === 'stock_movements') stockMovements.push(...inserted);
          if (name === 'batches_lots') batchesLots.push(...inserted);
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
            if (name === 'stock_levels' && stockLevels[0]) {
              Object.assign(stockLevels[0], updates);
            }
            if (name === 'batches_lots' && batchesLots[0]) {
              // Apply batch update
              Object.assign(batchesLots[0], updates);
            }
          },
        }),
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => cb(tx),
    };

    return {
      db: tx,
      state: { stockLevels, stockMovements, batchesLots, outboxEvents },
    };
  }

  it('recalculates Weighted Average Cost (WAC) on receipts and records immutable stock_movements on dispatch', async () => {
    const { db, state } = createInMemoryInventoryDb();
    const controller = new InventoryWmsController(db, new OutboxService(), new InboxService());

    // 1. First GRN receipt: 10 units @ 100.00 -> WAC = 100.00
    const rec1 = await controller.atomicStockIncrement({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '66666666-6666-4666-8666-666666666661',
      warehouseId: WAREHOUSE_ID,
      referenceDocumentId: REF_DOC_1,
      reason: 'GRN_RECEIPT',
      items: [
        {
          productId: PRODUCT_ID,
          sku: 'CEYLON-CINN-1KG',
          quantity: '10.0000',
          unitCost: '100.00',
          batchNumber: 'BATCH-2026-A',
          expiryDate: '2027-01-15T00:00:00.000Z',
        },
      ],
    });
    assert.equal(rec1.updatedBalances[0].remainingQuantity, '10.0000');
    assert.equal(rec1.updatedBalances[0].unitWacCost, '100.00');

    // 2. Second GRN receipt: 10 units @ 150.00 -> WAC = (1000 + 1500) / 20 = 125.00
    const rec2 = await controller.atomicStockIncrement({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '66666666-6666-4666-8666-666666666662',
      warehouseId: WAREHOUSE_ID,
      referenceDocumentId: REF_DOC_2,
      reason: 'GRN_RECEIPT',
      items: [
        {
          productId: PRODUCT_ID,
          sku: 'CEYLON-CINN-1KG',
          quantity: '10.0000',
          unitCost: '150.00',
          batchNumber: 'BATCH-2026-B',
          expiryDate: '2027-06-15T00:00:00.000Z',
        },
      ],
    });
    assert.equal(rec2.updatedBalances[0].remainingQuantity, '20.0000');
    assert.equal(rec2.updatedBalances[0].unitWacCost, '125.00');

    // 3. Sales dispatch of 12 units -> remaining 8.0000 (<= reorderThreshold 10.0000)
    // COGS = 12 * 125.00 = 1500.00
    const dispatch = await controller.atomicStockDecrement({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '66666666-6666-4666-8666-666666666663',
      warehouseId: WAREHOUSE_ID,
      referenceDocumentId: REF_DOC_3,
      reason: 'SALES_DISPATCH',
      items: [
        {
          productId: PRODUCT_ID,
          sku: 'CEYLON-CINN-1KG',
          quantity: '12.0000',
        },
      ],
    });

    assert.equal(dispatch.success, true);
    assert.equal(dispatch.totalCogsValuation, '1500.00');
    assert.equal(dispatch.updatedBalances[0].remainingQuantity, '8.0000');
    assert.equal(state.stockMovements.length, 3, 'Every stock mutation must write an immutable movement row');
    assert.equal(state.stockMovements[2].quantityDelta, '-12.0000');
    assert.equal(state.stockMovements[2].balanceAfter, '8.0000');

    // Verify LOW_STOCK_THRESHOLD_BREACHED was emitted to inventory.outbox_events
    const lowStockEvents = state.outboxEvents.filter(
      (e) => e.eventName === ERP_EVENT_PATTERNS.LOW_STOCK_THRESHOLD_BREACHED,
    );
    assert.equal(lowStockEvents.length, 1, 'Must emit LOW_STOCK_THRESHOLD_BREACHED when balance <= 10.0000');
  });
});
