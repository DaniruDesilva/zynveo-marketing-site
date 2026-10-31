import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ERP_EVENT_PATTERNS, ERP_RPC_PATTERNS } from '@zynveo/contracts';
import { InboxService, OutboxService, RpcClientProxy } from '@zynveo/microservice-chassis';
import { ManufacturingController, calculateBomBackflushQuantities } from '../main';

describe('svc-manufacturing BOM Scrap Backflush & Production Costing Saga', () => {
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const FG_PRODUCT_ID = '33333333-3333-4333-8333-333333333331';
  const RM_PRODUCT_ID = '33333333-3333-4333-8333-333333333332';
  const RAW_WH_ID = '44444444-4444-4444-8444-444444444441';
  const FG_WH_ID = '44444444-4444-4444-8444-444444444442';

  function createInMemoryMfgDb() {
    const boms: any[] = [];
    const bomItems: any[] = [];
    const workOrders: any[] = [];
    const materialConsumptions: any[] = [];
    const outboxEvents: any[] = [];

    const tx: any = {
      select: () => ({
        from: (table: any) => ({
          where: async () => {
            const name = table?.[Symbol.for('drizzle:Name')];
            if (name === 'bills_of_materials') return boms;
            if (name === 'bom_items') return bomItems;
            if (name === 'work_orders') return workOrders;
            return [];
          },
        }),
      }),
      insert: (table: any) => ({
        values: (val: any) => {
          const name = table?.[Symbol.for('drizzle:Name')];
          const rows = Array.isArray(val) ? val : [val];
          const inserted = rows.map((r, i) => ({
            id:
              r.id ||
              `55555555-5555-4555-8555-${String(100000000000 + boms.length + bomItems.length + workOrders.length + i).slice(-12)}`,
            ...r,
          }));
          if (name === 'bills_of_materials') boms.push(...inserted);
          if (name === 'bom_items') bomItems.push(...inserted);
          if (name === 'work_orders') workOrders.push(...inserted);
          if (name === 'material_consumptions') materialConsumptions.push(...inserted);
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
            if (name === 'work_orders' && workOrders[0]) {
              Object.assign(workOrders[0], updates);
            }
          },
        }),
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => cb(tx),
    };

    return {
      db: tx,
      state: { boms, bomItems, workOrders, materialConsumptions, outboxEvents },
    };
  }

  it('backflushes raw materials with scrap percentage and yields finished goods with exact unit cost', async () => {
    // Pure calculator check: 100 units * 0.5000 kg * (1 + 5% scrap) = 52.5000 kg
    const backflush = calculateBomBackflushQuantities('100.0000', [
      {
        rawMaterialProductId: RM_PRODUCT_ID,
        quantityRequiredPerUnit: '0.5000',
        scrapPercentage: '5.00',
      },
    ]);
    assert.equal(backflush[0].consumedQuantity, '52.5000');

    const { db, state } = createInMemoryMfgDb();
    const rpcLog: Array<{ cmd: string; payload: any }> = [];

    const mockRpc: RpcClientProxy = {
      send: async <TResponse = any>(pattern: { cmd: string }, payload: any): Promise<TResponse> => {
        rpcLog.push({ cmd: pattern.cmd, payload });
        if (pattern.cmd === ERP_RPC_PATTERNS.INVENTORY.ATOMIC_STOCK_DECREMENT.cmd) {
          return {
            success: true,
            totalCogsValuation: '10500.00', // 52.5000 kg * 200.00 WAC
            updatedBalances: [],
          } as unknown as TResponse;
        }
        if (pattern.cmd === ERP_RPC_PATTERNS.INVENTORY.ATOMIC_STOCK_INCREMENT.cmd) {
          return {
            success: true,
            totalCogsValuation: '14000.00',
            updatedBalances: [],
          } as unknown as TResponse;
        }
        throw new Error(`Unexpected RPC pattern: ${pattern.cmd}`);
      },
    };

    const controller = new ManufacturingController(
      db,
      new OutboxService(),
      new InboxService(),
      mockRpc,
    );

    // 1. Create BOM (labor: 20.00/unit, overhead: 15.00/unit)
    const bom = await controller.createBom({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '66666666-6666-4666-8666-666666666661',
      finishedProductId: FG_PRODUCT_ID,
      bomCode: 'BOM-CINN-POWDER-500G',
      version: '1.0',
      laborCostPerUnit: '20.00',
      overheadCostPerUnit: '15.00',
      components: [
        {
          rawMaterialProductId: RM_PRODUCT_ID,
          quantityRequiredPerUnit: '0.5000',
          scrapPercentage: '5.00',
        },
      ],
    });

    // 2. Release Work Order for 100 units
    const wo = await controller.releaseWorkOrder({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '66666666-6666-4666-8666-666666666662',
      bomId: bom.bomId,
      finishedProductId: FG_PRODUCT_ID,
      plannedQty: '100.0000',
      sourceRawWarehouseId: RAW_WH_ID,
      targetFinishedWarehouseId: FG_WH_ID,
    });

    // 3. Complete Work Order for 100 units:
    // RM = 10500.00, Labor = 2000.00, Overhead = 1500.00 -> Total = 14000.00 -> Unit FG Cost = 140.00
    const completed = await controller.completeWorkOrder({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '66666666-6666-4666-8666-666666666663',
      workOrderId: wo.workOrderId,
      actualProducedQty: '100.0000',
      outputBatchNumber: 'FG-BATCH-2026-101',
    });

    assert.equal(completed.status, 'COMPLETED');
    assert.equal(completed.rawMaterialCostTotal, '10500.00');
    assert.equal(completed.laborCostTotal, '2000.00');
    assert.equal(completed.overheadCostTotal, '1500.00');
    assert.equal(completed.totalProductionCost, '14000.00');
    assert.equal(completed.unitFinishedGoodCost, '140.00');
    assert.equal(rpcLog.length, 2);
    assert.equal(rpcLog[0].payload.items[0].quantity, '52.5000');
    assert.equal(rpcLog[1].payload.items[0].unitCost, '140.00');
    assert.equal(state.outboxEvents.length, 1);
    assert.equal(state.outboxEvents[0].eventName, ERP_EVENT_PATTERNS.WORK_ORDER_COMPLETED);
  });
});

