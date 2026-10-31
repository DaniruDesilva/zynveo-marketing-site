import Decimal from 'decimal.js';
import { and, eq } from 'drizzle-orm';
import {
  ApproveGrnDto,
  ApproveGrnSchema,
  CreatePurchaseOrderDto,
  CreatePurchaseOrderSchema,
  ERP_EVENT_PATTERNS,
  ERP_RPC_PATTERNS,
  EventEnvelope,
  GrnApprovedEventSchema,
  GrnVerifiedLineItem,
  LowStockThresholdBreachedEvent,
  LowStockThresholdBreachedEventSchema,
  VerifyThreeWayMatchDto,
  VerifyThreeWayMatchResponse,
  VerifyThreeWayMatchSchema,
} from '@zynveo/contracts';
import * as scmSchema from '@zynveo/database/scm';
import {
  Controller,
  DRIZZLE_DB,
  DrizzleModule,
  ErpRpcException,
  EventPattern,
  InboxService,
  Inject,
  MessagePattern,
  Module,
  OutboxService,
  Payload,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Controller()
export class ProcurementController {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: any,
    private readonly outboxService: OutboxService,
    private readonly inboxService: InboxService,
  ) {}

  /**
   * Synchronous RPC (`scm.create_purchase_order`):
   * Calculates exact line totals using `Decimal` (ROUND_HALF_UP) and persists `scm.purchase_orders` + `scm.po_lines`.
   */
  @MessagePattern(ERP_RPC_PATTERNS.PROCUREMENT.CREATE_PURCHASE_ORDER)
  async createPurchaseOrder(@Payload() rawPayload: CreatePurchaseOrderDto) {
    const dto = CreatePurchaseOrderSchema.parse(rawPayload);

    let subtotalAmount = new Decimal(0);
    const computedLines = dto.lines.map((line) => {
      const qty = new Decimal(line.orderedQty);
      const cost = new Decimal(line.unitCost);
      const lineTotal = qty.mul(cost).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      subtotalAmount = subtotalAmount.plus(lineTotal);

      return {
        productId: line.productId,
        sku: line.sku,
        orderedQty: qty.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4),
        unitCost: cost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
        lineTotal: lineTotal.toFixed(2),
      };
    });

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;

    return this.db.transaction(async (tx: any) => {
      const [po] = await tx
        .insert(scmSchema.purchaseOrders)
        .values({
          tenantId: dto.tenantId,
          poNumber,
          supplierId: dto.supplierId,
          warehouseId: dto.warehouseId,
          status: 'ISSUED',
          orderDate: new Date(),
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          subtotalAmount: subtotalAmount.toFixed(2),
          taxAmount: '0.00',
          totalAmount: subtotalAmount.toFixed(2),
          notes: dto.notes ?? null,
        })
        .returning();

      const insertedLines = await tx
        .insert(scmSchema.poLines)
        .values(
          computedLines.map((l) => ({
            tenantId: dto.tenantId,
            purchaseOrderId: po.id,
            productId: l.productId,
            sku: l.sku,
            description: l.sku,
            orderedQty: l.orderedQty,
            receivedQty: '0.0000',
            unitCost: l.unitCost,
            lineTotal: l.lineTotal,
          })),
        )
        .returning();

      return {
        purchaseOrderId: po.id,
        poNumber: po.poNumber,
        status: po.status,
        totalAmount: po.totalAmount,
        lines: insertedLines,
      };
    });
  }

  /**
   * Synchronous RPC (`scm.approve_grn`):
   * Loads authoritative `orderedQty` and `unitCost` from `scm.po_lines` (never trusting client prices),
   * validates received quantities against open PO balances using `Decimal`, persists `scm.goods_received_notes` + `scm.grn_lines`,
   * and writes `GRN_APPROVED` to `scm.outbox_events` in the same ACID transaction.
   */
  @MessagePattern(ERP_RPC_PATTERNS.PROCUREMENT.APPROVE_GRN)
  async approveGrn(@Payload() rawPayload: ApproveGrnDto) {
    const dto = ApproveGrnSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const poRows = await tx
        .select()
        .from(scmSchema.purchaseOrders)
        .where(
          and(
            eq(scmSchema.purchaseOrders.tenantId, dto.tenantId),
            eq(scmSchema.purchaseOrders.id, dto.purchaseOrderId),
          ),
        );

      const po = poRows[0];
      if (!po) {
        throw new ErpRpcException(
          'PO_NOT_FOUND',
          `Purchase Order ${dto.purchaseOrderId} not found`,
          404,
        );
      }

      const poLineRows = await tx
        .select()
        .from(scmSchema.poLines)
        .where(
          and(
            eq(scmSchema.poLines.tenantId, dto.tenantId),
            eq(scmSchema.poLines.purchaseOrderId, dto.purchaseOrderId),
          ),
        );

      const poLineMap = new Map<string, any>();
      for (const pl of poLineRows) {
        poLineMap.set(pl.id, pl);
      }

      let totalAcceptedCost = new Decimal(0);
      const verifiedLines: GrnVerifiedLineItem[] = [];

      for (const lineInput of dto.lines) {
        const poLine = poLineMap.get(lineInput.poLineId);
        if (!poLine || poLine.productId !== lineInput.productId) {
          throw new ErpRpcException(
            'INVALID_PO_LINE',
            `PO line ${lineInput.poLineId} does not belong to Purchase Order ${po.poNumber}`,
            400,
          );
        }

        const orderedQty = new Decimal(poLine.orderedQty);
        const prevReceivedQty = new Decimal(poLine.receivedQty || '0.0000');
        const receivedQty = new Decimal(lineInput.receivedQty);
        const rejectedQty = new Decimal(lineInput.rejectedQty || '0.0000');
        const newCumulativeReceived = prevReceivedQty.plus(receivedQty);

        if (newCumulativeReceived.gt(orderedQty)) {
          throw new ErpRpcException(
            'OVER_RECEIPT_NOT_ALLOWED',
            `Received quantity (${newCumulativeReceived.toFixed(4)}) exceeds PO ordered quantity (${orderedQty.toFixed(4)}) for SKU ${poLine.sku}`,
            422,
          );
        }

        const authoritativeUnitCost = new Decimal(poLine.unitCost).toDecimalPlaces(
          2,
          Decimal.ROUND_HALF_UP,
        );
        const lineTotalCost = receivedQty
          .mul(authoritativeUnitCost)
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

        totalAcceptedCost = totalAcceptedCost.plus(lineTotalCost);

        // Update PO line cumulative received quantity
        poLine.receivedQty = newCumulativeReceived.toFixed(4);
        await tx
          .update(scmSchema.poLines)
          .set({
            receivedQty: newCumulativeReceived.toFixed(4),
            updatedAt: new Date(),
          })
          .where(eq(scmSchema.poLines.id, poLine.id));

        verifiedLines.push({
          productId: lineInput.productId,
          sku: poLine.sku,
          poLineId: poLine.id,
          orderedQty: orderedQty.toFixed(4),
          receivedQty: receivedQty.toFixed(4),
          rejectedQty: rejectedQty.toFixed(4),
          unitCost: authoritativeUnitCost.toFixed(2),
          lineTotalCost: lineTotalCost.toFixed(2),
          batchNumber: lineInput.batchNumber,
          expiryDate: lineInput.expiryDate,
        });
      }

      const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;
      const [grn] = await tx
        .insert(scmSchema.goodsReceivedNotes)
        .values({
          id: dto.grnId,
          tenantId: dto.tenantId,
          grnNumber,
          purchaseOrderId: po.id,
          supplierId: po.supplierId,
          warehouseId: dto.warehouseId,
          status: 'APPROVED',
          date: new Date(),
          total: totalAcceptedCost.toFixed(2),
          approvedByUserId: dto.actorUserId,
          approvedAt: new Date(),
        })
        .returning();

      await tx.insert(scmSchema.grnLines).values(
        verifiedLines.map((vl) => ({
          tenantId: dto.tenantId,
          grnId: grn.id,
          poLineId: vl.poLineId,
          productId: vl.productId,
          sku: vl.sku,
          description: vl.sku,
          orderedQty: vl.orderedQty,
          quantity: vl.receivedQty,
          rejectedQty: vl.rejectedQty,
          unitCost: vl.unitCost,
          lineTotal: vl.lineTotalCost,
          batchNumber: vl.batchNumber,
          expiryDate: vl.expiryDate ? new Date(vl.expiryDate) : null,
        })),
      );

      // Update Purchase Order status (COMPLETED if all lines fully received, else PARTIALLY_RECEIVED)
      const allCompleted = Array.from(poLineMap.values()).every((pl: any) =>
        new Decimal(pl.receivedQty || '0').gte(new Decimal(pl.orderedQty)),
      );
      const nextPoStatus = allCompleted ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
      await tx
        .update(scmSchema.purchaseOrders)
        .set({ status: nextPoStatus, updatedAt: new Date() })
        .where(eq(scmSchema.purchaseOrders.id, po.id));

      const grnApprovedEvent = GrnApprovedEventSchema.parse({
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        actorUserId: dto.actorUserId,
        correlationId: dto.correlationId,
        grnId: grn.id,
        grnNumber: grn.grnNumber,
        purchaseOrderId: po.id,
        supplierId: po.supplierId,
        warehouseId: dto.warehouseId,
        totalAcceptedCost: totalAcceptedCost.toFixed(2),
        lines: verifiedLines,
      });

      const outboxRow = await this.outboxService.enqueue(tx, scmSchema.scmOutboxEvents, {
        tenantId: dto.tenantId,
        actorUserId: dto.actorUserId,
        sourceService: 'svc-procurement',
        aggregateType: 'GRN',
        aggregateId: grn.id,
        eventName: ERP_EVENT_PATTERNS.GRN_APPROVED,
        correlationId: dto.correlationId,
        payload: grnApprovedEvent,
      });

      return {
        grnId: grn.id,
        grnNumber: grn.grnNumber,
        status: 'APPROVED' as const,
        purchaseOrderStatus: nextPoStatus,
        totalAcceptedCost: totalAcceptedCost.toFixed(2),
        outboxEventId: outboxRow.id,
      };
    });
  }

  /**
   * Synchronous RPC (`scm.verify_three_way_match`):
   * Enforces the 3-Way Match invariant using `Decimal`:
   *   PO Ordered Qty & Unit Cost == GRN Accepted Qty == Supplier Bill Total Amount
   */
  @MessagePattern(ERP_RPC_PATTERNS.PROCUREMENT.VERIFY_THREE_WAY_MATCH)
  async verifyThreeWayMatch(
    @Payload() rawPayload: VerifyThreeWayMatchDto,
  ): Promise<VerifyThreeWayMatchResponse> {
    const dto = VerifyThreeWayMatchSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const poRows = await tx
        .select()
        .from(scmSchema.purchaseOrders)
        .where(
          and(
            eq(scmSchema.purchaseOrders.tenantId, dto.tenantId),
            eq(scmSchema.purchaseOrders.id, dto.purchaseOrderId),
          ),
        );
      const po = poRows[0];
      if (!po) {
        throw new ErpRpcException('PO_NOT_FOUND', `PO ${dto.purchaseOrderId} not found`, 404);
      }

      const poLineRows = await tx
        .select()
        .from(scmSchema.poLines)
        .where(
          and(
            eq(scmSchema.poLines.tenantId, dto.tenantId),
            eq(scmSchema.poLines.purchaseOrderId, dto.purchaseOrderId),
          ),
        );

      const grnRows = await tx
        .select()
        .from(scmSchema.goodsReceivedNotes)
        .where(
          and(
            eq(scmSchema.goodsReceivedNotes.tenantId, dto.tenantId),
            eq(scmSchema.goodsReceivedNotes.id, dto.grnId),
          ),
        );
      const grn = grnRows[0];
      if (!grn) {
        throw new ErpRpcException('GRN_NOT_FOUND', `GRN ${dto.grnId} not found`, 404);
      }

      const grnLineRows = await tx
        .select()
        .from(scmSchema.grnLines)
        .where(
          and(
            eq(scmSchema.grnLines.tenantId, dto.tenantId),
            eq(scmSchema.grnLines.grnId, dto.grnId),
          ),
        );

      const billRows = await tx
        .select()
        .from(scmSchema.supplierBills)
        .where(
          and(
            eq(scmSchema.supplierBills.tenantId, dto.tenantId),
            eq(scmSchema.supplierBills.id, dto.supplierBillId),
          ),
        );
      const bill = billRows[0];
      if (!bill) {
        throw new ErpRpcException(
          'SUPPLIER_BILL_NOT_FOUND',
          `Supplier Bill ${dto.supplierBillId} not found`,
          404,
        );
      }

      const discrepancies: VerifyThreeWayMatchResponse['discrepancies'] = [];

      for (const poLine of poLineRows) {
        const matchingGrnLines = grnLineRows.filter(
          (gl: any) => gl.poLineId === poLine.id || gl.productId === poLine.productId,
        );
        let grnAcceptedQty = new Decimal(0);
        for (const gl of matchingGrnLines) {
          grnAcceptedQty = grnAcceptedQty.plus(new Decimal(gl.quantity || '0'));
        }

        const poOrderedQty = new Decimal(poLine.orderedQty);
        const poUnitCost = new Decimal(poLine.unitCost);

        if (!grnAcceptedQty.equals(poOrderedQty)) {
          discrepancies.push({
            productId: poLine.productId,
            poOrderedQty: poOrderedQty.toFixed(4),
            grnAcceptedQty: grnAcceptedQty.toFixed(4),
            poUnitCost: poUnitCost.toFixed(2),
            billUnitCost: poUnitCost.toFixed(2),
            reason: `Quantity mismatch: PO ordered ${poOrderedQty.toFixed(4)} vs GRN accepted ${grnAcceptedQty.toFixed(4)}`,
          });
        }
      }

      const poTotal = new Decimal(po.totalAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const grnTotal = new Decimal(grn.total).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const billTotal = new Decimal(bill.totalAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      if (!poTotal.equals(grnTotal) || !grnTotal.equals(billTotal)) {
        const refProduct = poLineRows[0]?.productId || '00000000-0000-4000-8000-000000000000';
        const refOrderedQty = new Decimal(poLineRows[0]?.orderedQty || '1').toFixed(4);
        const refPoCost = new Decimal(poLineRows[0]?.unitCost || poTotal).toFixed(2);
        discrepancies.push({
          productId: refProduct,
          poOrderedQty: refOrderedQty,
          grnAcceptedQty: refOrderedQty,
          poUnitCost: refPoCost,
          billUnitCost: billTotal.toFixed(2),
          reason: `Total amount mismatch: PO (${poTotal.toFixed(2)}) vs GRN (${grnTotal.toFixed(2)}) vs Vendor Bill (${billTotal.toFixed(2)})`,
        });
      }

      const isMatched = discrepancies.length === 0;
      await tx
        .update(scmSchema.supplierBills)
        .set({
          threeWayMatchStatus: isMatched ? 'MATCHED' : 'DISCREPANCY',
          status: isMatched ? 'APPROVED' : 'DRAFT',
          updatedAt: new Date(),
        })
        .where(eq(scmSchema.supplierBills.id, bill.id));

      return {
        isMatched,
        poTotalAmount: poTotal.toFixed(2),
        grnTotalAmount: grnTotal.toFixed(2),
        billTotalAmount: billTotal.toFixed(2),
        discrepancies,
      };
    });
  }

  /**
   * BullMQ Durable Consumer (`event.inventory.low_stock_breached`):
   * Automatically raises a PENDING Purchase Requisition when stock falls below threshold.
   */
  @EventPattern(ERP_EVENT_PATTERNS.LOW_STOCK_THRESHOLD_BREACHED)
  async handleLowStockBreached(@Payload() envelope: EventEnvelope<LowStockThresholdBreachedEvent>) {
    const event = LowStockThresholdBreachedEventSchema.parse(envelope.payload);

    return this.inboxService.consumeIdempotently(
      this.db,
      scmSchema.scmProcessedEvents,
      'svc-procurement',
      envelope,
      async (tx: any) => {
        const [pr] = await tx
          .insert(scmSchema.purchaseRequisitions)
          .values({
            tenantId: event.tenantId,
            prNumber: `PR-AUTO-${Date.now().toString().slice(-6)}`,
            requestedByUserId: event.actorUserId,
            warehouseId: event.warehouseId,
            status: 'PENDING',
            notes: `Auto-generated for low stock on SKU ${event.sku} (Current: ${event.currentQuantity}, Threshold: ${event.reorderThreshold})`,
          })
          .returning();

        return { purchaseRequisitionId: pr.id, prNumber: pr.prNumber };
      },
    );
  }
}

@Module({
  imports: [DrizzleModule.forService('scm', scmSchema)],
  controllers: [ProcurementController],
  providers: [OutboxService, InboxService],
})
export class ProcurementModule {}

export async function startProcurementService(
  port = Number(process.env.SVC_PROCUREMENT_HEALTH_PORT || 4004),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-procurement',
    schemaName: 'scm',
    healthPort: port,
    appModule: ProcurementModule,
  });
}

if (require.main === module) {
  startProcurementService().catch((err) => {
    console.error('Failed to start svc-procurement:', err);
    process.exit(1);
  });
}
