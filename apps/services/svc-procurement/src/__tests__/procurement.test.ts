import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ERP_EVENT_PATTERNS } from '@zynveo/contracts';
import { InboxService, OutboxService } from '@zynveo/microservice-chassis';
import { ProcurementController } from '../main';

describe('svc-procurement 3-Way Match, GRN Engine & Auto-PR Consumer', () => {
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const SUPPLIER_ID = '33333333-3333-4333-8333-333333333333';
  const WAREHOUSE_ID = '44444444-4444-4444-8444-444444444444';
  const PRODUCT_ID = '55555555-5555-4555-8555-555555555555';
  const GRN_ID = '66666666-6666-4666-8666-666666666666';
  const BILL_MATCH_ID = '77777777-7777-4777-8777-777777777771';
  const BILL_MISMATCH_ID = '77777777-7777-4777-8777-777777777772';

  function createInMemoryScmDb() {
    const purchaseOrders: any[] = [];
    const poLines: any[] = [];
    const goodsReceivedNotes: any[] = [];
    const grnLines: any[] = [];
    const supplierBills: any[] = [];
    const purchaseRequisitions: any[] = [];
    const outboxEvents: any[] = [];
    const processedEvents = new Set<string>();
    let lastBillLookupId = BILL_MATCH_ID;

    const tx: any = {
      setBillLookupId: (id: string) => {
        lastBillLookupId = id;
      },
      select: () => ({
        from: (table: any) => ({
          where: async () => {
            const name = table?.[Symbol.for('drizzle:Name')];
            if (name === 'purchase_orders') return purchaseOrders;
            if (name === 'po_lines') return poLines;
            if (name === 'goods_received_notes') return goodsReceivedNotes;
            if (name === 'grn_lines') return grnLines;
            if (name === 'supplier_bills') {
              return supplierBills.filter((b) => b.id === lastBillLookupId);
            }
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
              `88888888-8888-4888-8888-${String(100000000000 + purchaseOrders.length + poLines.length + i).slice(-12)}`,
            ...r,
          }));
          if (name === 'purchase_orders') purchaseOrders.push(...inserted);
          if (name === 'po_lines') poLines.push(...inserted);
          if (name === 'goods_received_notes') goodsReceivedNotes.push(...inserted);
          if (name === 'grn_lines') grnLines.push(...inserted);
          if (name === 'supplier_bills') supplierBills.push(...inserted);
          if (name === 'purchase_requisitions') purchaseRequisitions.push(...inserted);
          if (name === 'outbox_events') outboxEvents.push(...inserted);

          return {
            returning: async () => inserted,
            onConflictDoNothing: () => ({
              returning: async () => {
                const first = inserted[0];
                const key = `${first.tenantId}:${first.eventId}`;
                if (processedEvents.has(key)) return [];
                processedEvents.add(key);
                return inserted;
              },
            }),
          };
        },
      }),
      update: (table: any) => ({
        set: (updates: any) => ({
          where: async () => {
            const name = table?.[Symbol.for('drizzle:Name')];
            if (name === 'purchase_orders' && purchaseOrders[0]) {
              Object.assign(purchaseOrders[0], updates);
            }
            if (name === 'po_lines' && poLines[0]) {
              Object.assign(poLines[0], updates);
            }
            if (name === 'supplier_bills') {
              const target = supplierBills.find((b) => b.id === lastBillLookupId);
              if (target) Object.assign(target, updates);
            }
          },
        }),
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => cb(tx),
    };

    return {
      db: tx,
      state: {
        purchaseOrders,
        poLines,
        goodsReceivedNotes,
        grnLines,
        supplierBills,
        purchaseRequisitions,
        outboxEvents,
      },
    };
  }

  it('creates PO, approves GRN using authoritative PO unitCost, and verifies 3-Way Match', async () => {
    const { db, state } = createInMemoryScmDb();
    const controller = new ProcurementController(db, new OutboxService(), new InboxService());

    // 1. Create PO: 50 units @ 240.00 = 12,000.00
    const po = await controller.createPurchaseOrder({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '99999999-9999-4999-8999-999999999991',
      supplierId: SUPPLIER_ID,
      warehouseId: WAREHOUSE_ID,
      lines: [
        {
          productId: PRODUCT_ID,
          sku: 'RAW-CLOVE-1KG',
          orderedQty: '50.0000',
          unitCost: '240.00',
        },
      ],
    });

    assert.equal(po.totalAmount, '12000.00');
    const poLineId = po.lines[0].id;

    // 2. Approve GRN for full 50 units -> authoritative cost 12,000.00 & emits GRN_APPROVED
    const grn = await controller.approveGrn({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '99999999-9999-4999-8999-999999999992',
      grnId: GRN_ID,
      purchaseOrderId: po.purchaseOrderId,
      warehouseId: WAREHOUSE_ID,
      lines: [
        {
          poLineId,
          productId: PRODUCT_ID,
          receivedQty: '50.0000',
          rejectedQty: '0.0000',
          batchNumber: 'LOT-CLOVE-2026',
        },
      ],
    });

    assert.equal(grn.status, 'APPROVED');
    assert.equal(grn.purchaseOrderStatus, 'COMPLETED');
    assert.equal(grn.totalAcceptedCost, '12000.00');
    assert.equal(state.outboxEvents.length, 1);
    assert.equal(state.outboxEvents[0].eventName, ERP_EVENT_PATTERNS.GRN_APPROVED);

    // 3. Seed two supplier bills: one matching (12000.00) and one overcharged (12500.00)
    state.supplierBills.push(
      {
        id: BILL_MATCH_ID,
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        purchaseOrderId: po.purchaseOrderId,
        grnId: GRN_ID,
        totalAmount: '12000.00',
        threeWayMatchStatus: 'PENDING',
        status: 'DRAFT',
      },
      {
        id: BILL_MISMATCH_ID,
        tenantId: TENANT_ID,
        supplierId: SUPPLIER_ID,
        purchaseOrderId: po.purchaseOrderId,
        grnId: GRN_ID,
        totalAmount: '12500.00',
        threeWayMatchStatus: 'PENDING',
        status: 'DRAFT',
      },
    );

    db.setBillLookupId(BILL_MATCH_ID);
    const matchRes = await controller.verifyThreeWayMatch({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '99999999-9999-4999-8999-999999999993',
      purchaseOrderId: po.purchaseOrderId,
      grnId: GRN_ID,
      supplierBillId: BILL_MATCH_ID,
    });
    assert.equal(matchRes.isMatched, true);
    assert.equal(matchRes.discrepancies.length, 0);

    db.setBillLookupId(BILL_MISMATCH_ID);
    const mismatchRes = await controller.verifyThreeWayMatch({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '99999999-9999-4999-8999-999999999994',
      purchaseOrderId: po.purchaseOrderId,
      grnId: GRN_ID,
      supplierBillId: BILL_MISMATCH_ID,
    });
    assert.equal(mismatchRes.isMatched, false);
    assert.equal(mismatchRes.discrepancies.length, 1);
  });
});

