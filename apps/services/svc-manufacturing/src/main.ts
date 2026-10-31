import Decimal from 'decimal.js';
import { and, eq } from 'drizzle-orm';
import {
  AtomicStockMutationResponse,
  CompleteWorkOrderDto,
  CompleteWorkOrderSchema,
  CreateBomDto,
  CreateBomSchema,
  ERP_EVENT_PATTERNS,
  ERP_RPC_PATTERNS,
  ReleaseWorkOrderDto,
  ReleaseWorkOrderSchema,
  WorkOrderCompletedEventSchema,
} from '@zynveo/contracts';
import * as mfgSchema from '@zynveo/database/manufacturing';
import {
  Controller,
  DRIZZLE_DB,
  DrizzleModule,
  ErpRpcException,
  InboxService,
  Inject,
  MessagePattern,
  Module,
  OutboxService,
  Payload,
  RpcClientProxy,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

export const MFG_RPC_CLIENT = 'ZYNVEO_MFG_RPC_CLIENT';

export interface CalculatedBomConsumption {
  rawMaterialProductId: string;
  consumedQuantity: string;
}

/**
 * Pure Decimal BOM backflush calculator with scrap percentage allowance:
 * ConsumedQty = ActualProducedQty * QuantityRequiredPerUnit * (1 + ScrapPercentage / 100)
 */
export function calculateBomBackflushQuantities(
  actualProducedQty: string,
  components: Array<{
    rawMaterialProductId: string;
    quantityRequiredPerUnit: string;
    scrapPercentage?: string;
  }>,
): CalculatedBomConsumption[] {
  const produced = new Decimal(actualProducedQty);
  if (produced.lte(0)) {
    throw new Error('Actual produced quantity must be strictly positive.');
  }

  return components.map((comp) => {
    const qtyPerUnit = new Decimal(comp.quantityRequiredPerUnit);
    const scrapPct = new Decimal(comp.scrapPercentage || '0.00');
    const scrapMultiplier = new Decimal(1).plus(scrapPct.div(100));
    const consumed = produced
      .mul(qtyPerUnit)
      .mul(scrapMultiplier)
      .toDecimalPlaces(4, Decimal.ROUND_HALF_UP);

    return {
      rawMaterialProductId: comp.rawMaterialProductId,
      consumedQuantity: consumed.toFixed(4),
    };
  });
}

@Controller()
export class ManufacturingController {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: any,
    private readonly outboxService: OutboxService,
    private readonly inboxService: InboxService,
    @Inject(MFG_RPC_CLIENT)
    private readonly rpcClient?: RpcClientProxy,
  ) {}

  /**
   * Synchronous RPC (`mfg.create_bom`):
   * Persists a Bill of Materials header (`manufacturing.bills_of_materials`) and its component ratios (`manufacturing.bom_items`).
   */
  @MessagePattern(ERP_RPC_PATTERNS.MANUFACTURING.CREATE_BOM)
  async createBom(@Payload() rawPayload: CreateBomDto) {
    const dto = CreateBomSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const [bom] = await tx
        .insert(mfgSchema.billsOfMaterials)
        .values({
          tenantId: dto.tenantId,
          finishedProductId: dto.finishedProductId,
          bomCode: dto.bomCode,
          version: dto.version,
          laborCostPerUnit: new Decimal(dto.laborCostPerUnit)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toFixed(2),
          overheadCostPerUnit: new Decimal(dto.overheadCostPerUnit)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
            .toFixed(2),
          isActive: true,
        })
        .returning();

      const items = await tx
        .insert(mfgSchema.bomItems)
        .values(
          dto.components.map((comp) => ({
            tenantId: dto.tenantId,
            bomId: bom.id,
            rawMaterialProductId: comp.rawMaterialProductId,
            quantityRequiredPerUnit: new Decimal(comp.quantityRequiredPerUnit)
              .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
              .toFixed(4),
            scrapPercentage: new Decimal(comp.scrapPercentage || '0.00')
              .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
              .toFixed(2),
          })),
        )
        .returning();

      return {
        bomId: bom.id,
        bomCode: bom.bomCode,
        version: bom.version,
        finishedProductId: bom.finishedProductId,
        componentsCount: items.length,
      };
    });
  }

  /**
   * Synchronous RPC (`mfg.release_work_order`):
   * Releases a production Work Order to the shop floor.
   */
  @MessagePattern(ERP_RPC_PATTERNS.MANUFACTURING.RELEASE_WORK_ORDER)
  async releaseWorkOrder(@Payload() rawPayload: ReleaseWorkOrderDto) {
    const dto = ReleaseWorkOrderSchema.parse(rawPayload);

    const bomRows = await this.db
      .select()
      .from(mfgSchema.billsOfMaterials)
      .where(
        and(
          eq(mfgSchema.billsOfMaterials.tenantId, dto.tenantId),
          eq(mfgSchema.billsOfMaterials.id, dto.bomId),
        ),
      );

    const bom = bomRows[0];
    if (!bom) {
      throw new ErpRpcException('BOM_NOT_FOUND', `BOM ${dto.bomId} not found`, 404);
    }

    const workOrderNumber = `WO-${Date.now().toString().slice(-6)}`;
    const [wo] = await this.db
      .insert(mfgSchema.workOrders)
      .values({
        tenantId: dto.tenantId,
        workOrderNumber,
        bomId: bom.id,
        finishedProductId: dto.finishedProductId,
        sourceRawWarehouseId: dto.sourceRawWarehouseId,
        targetFinishedWarehouseId: dto.targetFinishedWarehouseId,
        plannedQty: new Decimal(dto.plannedQty).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4),
        actualProducedQty: '0.0000',
        status: 'RELEASED',
        scheduledStartDate: dto.scheduledStartDate ? new Date(dto.scheduledStartDate) : new Date(),
      })
      .returning();

    return {
      workOrderId: wo.id,
      workOrderNumber: wo.workOrderNumber,
      status: wo.status,
      plannedQty: wo.plannedQty,
    };
  }

  /**
   * Production Backflush & Costing Saga Orchestrator (`mfg.complete_work_order`):
   * 1. Loads Work Order, BOM header, and BOM component ratios from `manufacturing` schema.
   * 2. Computes scrap-adjusted raw material consumption using `Decimal`.
   * 3. Calls `svc-inventory-wms` (`inventory.atomic_stock_decrement`) to consume raw materials and obtain WAC cost.
   * 4. Computes total production cost (`RM + Labor + Overhead`) and unit FG cost via `Decimal`.
   * 5. Calls `svc-inventory-wms` (`inventory.atomic_stock_increment`) to yield finished goods into target warehouse.
   * 6. Marks Work Order `COMPLETED` and enqueues `WORK_ORDER_COMPLETED` in `manufacturing.outbox_events` in one transaction.
   */
  @MessagePattern(ERP_RPC_PATTERNS.MANUFACTURING.COMPLETE_WORK_ORDER)
  async completeWorkOrder(@Payload() rawPayload: CompleteWorkOrderDto) {
    const dto = CompleteWorkOrderSchema.parse(rawPayload);

    const woRows = await this.db
      .select()
      .from(mfgSchema.workOrders)
      .where(
        and(
          eq(mfgSchema.workOrders.tenantId, dto.tenantId),
          eq(mfgSchema.workOrders.id, dto.workOrderId),
        ),
      );
    const wo = woRows[0];
    if (!wo) {
      throw new ErpRpcException('WORK_ORDER_NOT_FOUND', `Work Order ${dto.workOrderId} not found`, 404);
    }

    if (wo.status === 'COMPLETED' || wo.status === 'CANCELLED') {
      throw new ErpRpcException(
        'INVALID_WORK_ORDER_STATUS',
        `Work Order ${wo.workOrderNumber} cannot be completed from status ${wo.status}`,
        409,
      );
    }

    const bomRows = await this.db
      .select()
      .from(mfgSchema.billsOfMaterials)
      .where(
        and(
          eq(mfgSchema.billsOfMaterials.tenantId, dto.tenantId),
          eq(mfgSchema.billsOfMaterials.id, wo.bomId),
        ),
      );
    const bom = bomRows[0];
    if (!bom) {
      throw new ErpRpcException('BOM_NOT_FOUND', `BOM ${wo.bomId} not found`, 404);
    }

    const bomComponents = await this.db
      .select()
      .from(mfgSchema.bomItems)
      .where(
        and(
          eq(mfgSchema.bomItems.tenantId, dto.tenantId),
          eq(mfgSchema.bomItems.bomId, bom.id),
        ),
      );

    const backflushedItems = calculateBomBackflushQuantities(
      dto.actualProducedQty,
      bomComponents.map((c: any) => ({
        rawMaterialProductId: c.rawMaterialProductId,
        quantityRequiredPerUnit: String(c.quantityRequiredPerUnit),
        scrapPercentage: String(c.scrapPercentage || '0.00'),
      })),
    );

    // Step 3: Backflush Raw Materials via svc-inventory-wms & get WAC valuation
    let rawMaterialCostTotal = new Decimal('0.00');
    if (this.rpcClient) {
      const rmRes = await this.rpcClient.send<AtomicStockMutationResponse>(
        ERP_RPC_PATTERNS.INVENTORY.ATOMIC_STOCK_DECREMENT,
        {
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          actorUserId: dto.actorUserId,
          correlationId: dto.correlationId,
          warehouseId: wo.sourceRawWarehouseId,
          referenceDocumentId: wo.id,
          reason: 'PRODUCTION_RAW_CONSUME',
          items: backflushedItems.map((bi) => ({
            productId: bi.rawMaterialProductId,
            sku: `RM-${bi.rawMaterialProductId.slice(0, 8)}`,
            quantity: bi.consumedQuantity,
          })),
        },
      );
      rawMaterialCostTotal = new Decimal(rmRes.totalCogsValuation);
    }

    const actualQty = new Decimal(dto.actualProducedQty);
    const laborCostTotal = actualQty
      .mul(new Decimal(bom.laborCostPerUnit || '0.00'))
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const overheadCostTotal = actualQty
      .mul(new Decimal(bom.overheadCostPerUnit || '0.00'))
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalProductionCost = rawMaterialCostTotal
      .plus(laborCostTotal)
      .plus(overheadCostTotal)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const unitFinishedGoodCost = totalProductionCost
      .div(actualQty)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Step 5: Increment Finished Goods Stock at Target Warehouse with calculated unitFinishedGoodCost
    if (this.rpcClient) {
      await this.rpcClient.send<AtomicStockMutationResponse>(
        ERP_RPC_PATTERNS.INVENTORY.ATOMIC_STOCK_INCREMENT,
        {
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          actorUserId: dto.actorUserId,
          correlationId: dto.correlationId,
          warehouseId: wo.targetFinishedWarehouseId,
          referenceDocumentId: wo.id,
          reason: 'PRODUCTION_FG_YIELD',
          items: [
            {
              productId: wo.finishedProductId,
              sku: `FG-${wo.finishedProductId.slice(0, 8)}`,
              quantity: actualQty.toFixed(4),
              unitCost: unitFinishedGoodCost.toFixed(2),
              batchNumber: dto.outputBatchNumber,
            },
          ],
        },
      );
    }

    // Step 6: Persist Work Order completion + Material Consumptions + Outbox event in one transaction
    return this.db.transaction(async (tx: any) => {
      await tx
        .update(mfgSchema.workOrders)
        .set({
          actualProducedQty: actualQty.toFixed(4),
          outputBatchNumber: dto.outputBatchNumber,
          rawMaterialCostTotal: rawMaterialCostTotal.toFixed(2),
          laborCostTotal: laborCostTotal.toFixed(2),
          overheadCostTotal: overheadCostTotal.toFixed(2),
          totalProductionCost: totalProductionCost.toFixed(2),
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mfgSchema.workOrders.id, wo.id));

      if (backflushedItems.length > 0) {
        await tx.insert(mfgSchema.materialConsumptions).values(
          backflushedItems.map((bi) => ({
            tenantId: dto.tenantId,
            workOrderId: wo.id,
            rawMaterialProductId: bi.rawMaterialProductId,
            consumedQuantity: bi.consumedQuantity,
            unitCost: '0.00',
            totalCost: '0.00',
            batchNumber: dto.outputBatchNumber,
          })),
        );
      }

      const completedEvent = WorkOrderCompletedEventSchema.parse({
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        actorUserId: dto.actorUserId,
        correlationId: dto.correlationId,
        workOrderId: wo.id,
        workOrderNumber: wo.workOrderNumber,
        bomId: bom.id,
        finishedProductId: wo.finishedProductId,
        actualProducedQty: actualQty.toFixed(4),
        outputBatchNumber: dto.outputBatchNumber,
        rawMaterialCostTotal: rawMaterialCostTotal.toFixed(2),
        laborCostTotal: laborCostTotal.toFixed(2),
        overheadCostTotal: overheadCostTotal.toFixed(2),
        totalProductionCost: totalProductionCost.toFixed(2),
        unitFinishedGoodCost: unitFinishedGoodCost.toFixed(2),
      });

      const outboxRow = await this.outboxService.enqueue(
        tx,
        mfgSchema.manufacturingOutboxEvents,
        {
          tenantId: dto.tenantId,
          actorUserId: dto.actorUserId,
          sourceService: 'svc-manufacturing',
          aggregateType: 'WORK_ORDER',
          aggregateId: wo.id,
          eventName: ERP_EVENT_PATTERNS.WORK_ORDER_COMPLETED,
          correlationId: dto.correlationId,
          payload: completedEvent,
        },
      );

      return {
        workOrderId: wo.id,
        workOrderNumber: wo.workOrderNumber,
        status: 'COMPLETED' as const,
        actualProducedQty: actualQty.toFixed(4),
        rawMaterialCostTotal: rawMaterialCostTotal.toFixed(2),
        laborCostTotal: laborCostTotal.toFixed(2),
        overheadCostTotal: overheadCostTotal.toFixed(2),
        totalProductionCost: totalProductionCost.toFixed(2),
        unitFinishedGoodCost: unitFinishedGoodCost.toFixed(2),
        outboxEventId: outboxRow.id,
      };
    });
  }
}

@Module({
  imports: [DrizzleModule.forService('manufacturing', mfgSchema)],
  controllers: [ManufacturingController],
  providers: [OutboxService, InboxService],
})
export class ManufacturingModule {}

export async function startManufacturingService(
  port = Number(process.env.SVC_MANUFACTURING_HEALTH_PORT || 4006),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-manufacturing',
    schemaName: 'manufacturing',
    healthPort: port,
    appModule: ManufacturingModule,
  });
}

if (require.main === module) {
  startManufacturingService().catch((err) => {
    console.error('Failed to start svc-manufacturing:', err);
    process.exit(1);
  });
}
