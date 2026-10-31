import Decimal from 'decimal.js';
import { and, eq, sql } from 'drizzle-orm';
import {
  AtomicStockMutationDto,
  AtomicStockMutationResponse,
  AtomicStockMutationSchema,
  ERP_EVENT_PATTERNS,
  ERP_RPC_PATTERNS,
  LowStockThresholdBreachedEventSchema,
  StockReservationDto,
  StockReservationSchema,
} from '@zynveo/contracts';
import {
  allocateFefoBatches,
  calculateDispatchCogs,
  calculateWeightedAverageCost,
} from '@zynveo/core-inventory';
import * as inventorySchema from '@zynveo/database/inventory';
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
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Controller()
export class InventoryWmsController {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: any,
    private readonly outboxService: OutboxService,
    private readonly inboxService: InboxService,
  ) {}

  /**
   * Synchronous RPC (`inventory.atomic_stock_decrement`):
   * Locks `inventory.stock_levels` with `SELECT ... FOR UPDATE`, performs FEFO batch selection if applicable,
   * decrements stock, writes an immutable row to `inventory.stock_movements`, calculates WAC-based COGS,
   * and emits `LOW_STOCK_THRESHOLD_BREACHED` to `inventory.outbox_events` if stock drops below threshold.
   */
  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.ATOMIC_STOCK_DECREMENT)
  async atomicStockDecrement(
    @Payload() rawPayload: AtomicStockMutationDto,
  ): Promise<AtomicStockMutationResponse> {
    const dto = AtomicStockMutationSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      let totalCogs = new Decimal(0);
      const updatedBalances: AtomicStockMutationResponse['updatedBalances'] = [];

      for (const item of dto.items) {
        const stockRow = await this.lockStockLevelRow(
          tx,
          dto.tenantId,
          dto.warehouseId,
          item.productId,
        );

        if (!stockRow) {
          throw new ErpRpcException(
            'INSUFFICIENT_STOCK',
            `No stock record found for SKU ${item.sku} (${item.productId}) in warehouse ${dto.warehouseId}`,
            409,
          );
        }

        const currentQty = new Decimal(stockRow.quantity || '0');
        const requestedQty = new Decimal(item.quantity);

        if (currentQty.lt(requestedQty)) {
          throw new ErpRpcException(
            'INSUFFICIENT_STOCK',
            `Insufficient stock for SKU ${item.sku}: available ${currentQty.toFixed(4)}, requested ${requestedQty.toFixed(4)}`,
            409,
          );
        }

        // FEFO batch allocation if batch lots exist for this product/warehouse
        const batchRows = await this.loadProductBatches(
          tx,
          dto.tenantId,
          dto.warehouseId,
          item.productId,
        );
        let allocatedBatchNumber = item.batchNumber ?? stockRow.batchNumber ?? null;

        if (batchRows.length > 0) {
          const allocations = allocateFefoBatches(batchRows, requestedQty.toFixed(4));
          allocatedBatchNumber = allocations.map((a) => a.batchNumber).join(',');
          for (const slice of allocations) {
            await tx
              .update(inventorySchema.batchesLots)
              .set({
                quantityAvailable: slice.remainingBatchQty,
                updatedAt: new Date(),
              })
              .where(eq(inventorySchema.batchesLots.id, slice.batchId));
          }
        }

        const currentWac = new Decimal(stockRow.unitWacCost || '0').toFixed(2);
        const { unitCost, totalCogs: lineCogs } = calculateDispatchCogs(
          requestedQty.toFixed(4),
          currentWac,
        );
        const newBalance = currentQty
          .minus(requestedQty)
          .toDecimalPlaces(4, Decimal.ROUND_HALF_UP)
          .toFixed(4);

        totalCogs = totalCogs.plus(new Decimal(lineCogs));

        // 1. Update stock_levels inside locked transaction
        await tx
          .update(inventorySchema.stockLevels)
          .set({
            quantity: newBalance,
            updatedAt: new Date(),
          })
          .where(eq(inventorySchema.stockLevels.id, stockRow.id));

        // 2. Insert immutable row into inventory.stock_movements (GEMINI.md Rule 3)
        await tx.insert(inventorySchema.stockMovements).values({
          tenantId: dto.tenantId,
          warehouseId: dto.warehouseId,
          productId: item.productId,
          variantId: stockRow.variantId ?? item.productId,
          reason: dto.reason,
          referenceDocumentId: dto.referenceDocumentId,
          batchNumber: allocatedBatchNumber,
          quantityDelta: requestedQty.negated().toFixed(4),
          balanceAfter: newBalance,
          unitCostAtMovement: unitCost,
          totalValuationDelta: new Decimal(lineCogs).negated().toFixed(2),
          actorUserId: dto.actorUserId,
          notes: `Dispatch (${dto.reason}) for SKU ${item.sku}`,
        });

        // 3. Emit LOW_STOCK_THRESHOLD_BREACHED if remaining balance <= reorderThreshold
        const reorderThreshold = new Decimal(stockRow.reorderThreshold || '10.0000');
        if (new Decimal(newBalance).lte(reorderThreshold)) {
          const lowStockPayload = LowStockThresholdBreachedEventSchema.parse({
            tenantId: dto.tenantId,
            branchId: dto.branchId,
            actorUserId: dto.actorUserId,
            correlationId: dto.correlationId,
            warehouseId: dto.warehouseId,
            productId: item.productId,
            sku: item.sku,
            currentQuantity: newBalance,
            reorderThreshold: reorderThreshold.toFixed(4),
          });

          await this.outboxService.enqueue(tx, inventorySchema.inventoryOutboxEvents, {
            tenantId: dto.tenantId,
            actorUserId: dto.actorUserId,
            sourceService: 'svc-inventory-wms',
            aggregateType: 'STOCK_LEVEL',
            aggregateId: stockRow.id,
            eventName: ERP_EVENT_PATTERNS.LOW_STOCK_THRESHOLD_BREACHED,
            correlationId: dto.correlationId,
            payload: lowStockPayload,
          });
        }

        updatedBalances.push({
          productId: item.productId,
          remainingQuantity: newBalance,
          unitWacCost: unitCost,
        });
      }

      await this.outboxService.enqueue(tx, inventorySchema.inventoryOutboxEvents, {
        tenantId: dto.tenantId,
        actorUserId: dto.actorUserId,
        sourceService: 'svc-inventory-wms',
        aggregateType: 'STOCK_MOVEMENT',
        aggregateId: dto.referenceDocumentId,
        eventName: ERP_EVENT_PATTERNS.STOCK_LEVEL_MUTATED,
        correlationId: dto.correlationId,
        payload: {
          warehouseId: dto.warehouseId,
          referenceDocumentId: dto.referenceDocumentId,
          reason: dto.reason,
          totalCogsValuation: totalCogs.toFixed(2),
          updatedBalances,
        },
      });

      return {
        success: true,
        totalCogsValuation: totalCogs.toFixed(2),
        updatedBalances,
      };
    });
  }

  /**
   * Synchronous RPC (`inventory.atomic_stock_increment`):
   * Locks `inventory.stock_levels` with `FOR UPDATE`, recalculates Weighted Average Cost (WAC) using `Decimal`,
   * increments stock, records batch/lot expiry if supplied, and writes an immutable `inventory.stock_movements` row.
   */
  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.ATOMIC_STOCK_INCREMENT)
  async atomicStockIncrement(
    @Payload() rawPayload: AtomicStockMutationDto,
  ): Promise<AtomicStockMutationResponse> {
    const dto = AtomicStockMutationSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      let totalReceiptValuation = new Decimal(0);
      const updatedBalances: AtomicStockMutationResponse['updatedBalances'] = [];

      for (const item of dto.items) {
        const existingRow = await this.lockStockLevelRow(
          tx,
          dto.tenantId,
          dto.warehouseId,
          item.productId,
        );

        const currentQty = existingRow ? String(existingRow.quantity || '0.0000') : '0.0000';
        const currentWac = existingRow ? String(existingRow.unitWacCost || '0.00') : '0.00';
        const unitCostInput = item.unitCost ?? currentWac;

        const wacResult = calculateWeightedAverageCost(
          currentQty,
          currentWac,
          item.quantity,
          unitCostInput,
        );

        totalReceiptValuation = totalReceiptValuation.plus(new Decimal(wacResult.receiptValuation));

        let stockLevelId: string;
        const variantId = existingRow?.variantId ?? item.productId;

        if (existingRow) {
          stockLevelId = existingRow.id;
          await tx
            .update(inventorySchema.stockLevels)
            .set({
              quantity: wacResult.newQuantityOnHand,
              unitWacCost: wacResult.newWac,
              batchNumber: item.batchNumber ?? existingRow.batchNumber ?? null,
              updatedAt: new Date(),
            })
            .where(eq(inventorySchema.stockLevels.id, existingRow.id));
        } else {
          const [created] = await tx
            .insert(inventorySchema.stockLevels)
            .values({
              tenantId: dto.tenantId,
              productId: item.productId,
              variantId,
              warehouseId: dto.warehouseId,
              quantity: wacResult.newQuantityOnHand,
              reservedQuantity: '0.0000',
              unitWacCost: wacResult.newWac,
              batchNumber: item.batchNumber ?? null,
              expirationDate: item.expiryDate ? new Date(item.expiryDate) : null,
            })
            .returning();
          stockLevelId = created.id;
        }

        if (item.batchNumber) {
          await tx.insert(inventorySchema.batchesLots).values({
            tenantId: dto.tenantId,
            productId: item.productId,
            variantId,
            warehouseId: dto.warehouseId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            quantityAvailable: new Decimal(item.quantity).toFixed(4),
            unitCost: new Decimal(unitCostInput).toFixed(2),
          });
        }

        // Insert immutable stock movement record (GEMINI.md Rule 3)
        await tx.insert(inventorySchema.stockMovements).values({
          tenantId: dto.tenantId,
          warehouseId: dto.warehouseId,
          productId: item.productId,
          variantId,
          reason: dto.reason,
          referenceDocumentId: dto.referenceDocumentId,
          batchNumber: item.batchNumber ?? null,
          quantityDelta: new Decimal(item.quantity).toFixed(4),
          balanceAfter: wacResult.newQuantityOnHand,
          unitCostAtMovement: new Decimal(unitCostInput).toFixed(2),
          totalValuationDelta: wacResult.receiptValuation,
          actorUserId: dto.actorUserId,
          notes: `Receipt (${dto.reason}) for SKU ${item.sku}`,
        });

        updatedBalances.push({
          productId: item.productId,
          remainingQuantity: wacResult.newQuantityOnHand,
          unitWacCost: wacResult.newWac,
        });
      }

      await this.outboxService.enqueue(tx, inventorySchema.inventoryOutboxEvents, {
        tenantId: dto.tenantId,
        actorUserId: dto.actorUserId,
        sourceService: 'svc-inventory-wms',
        aggregateType: 'STOCK_MOVEMENT',
        aggregateId: dto.referenceDocumentId,
        eventName: ERP_EVENT_PATTERNS.STOCK_LEVEL_MUTATED,
        correlationId: dto.correlationId,
        payload: {
          warehouseId: dto.warehouseId,
          referenceDocumentId: dto.referenceDocumentId,
          reason: dto.reason,
          totalCogsValuation: totalReceiptValuation.toFixed(2),
          updatedBalances,
        },
      });

      return {
        success: true,
        totalCogsValuation: totalReceiptValuation.toFixed(2),
        updatedBalances,
      };
    });
  }

  /**
   * Synchronous RPC (`inventory.reserve_stock`):
   * Places a soft stock reservation for a confirmed Sales Order.
   */
  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.RESERVE_STOCK)
  async reserveStock(@Payload() rawPayload: StockReservationDto) {
    const dto = StockReservationSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const reservations = [];

      for (const item of dto.items) {
        const stockRow = await this.lockStockLevelRow(
          tx,
          dto.tenantId,
          dto.warehouseId,
          item.productId,
        );
        if (!stockRow) {
          throw new ErpRpcException(
            'INSUFFICIENT_STOCK',
            `Cannot reserve SKU ${item.sku}: no stock in warehouse ${dto.warehouseId}`,
            409,
          );
        }

        const onHand = new Decimal(stockRow.quantity || '0');
        const reserved = new Decimal(stockRow.reservedQuantity || '0');
        const freeQty = onHand.minus(reserved);
        const reqQty = new Decimal(item.quantity);

        if (freeQty.lt(reqQty)) {
          throw new ErpRpcException(
            'INSUFFICIENT_STOCK',
            `Cannot reserve SKU ${item.sku}: free quantity ${freeQty.toFixed(4)} < requested ${reqQty.toFixed(4)}`,
            409,
          );
        }

        const newReserved = reserved.plus(reqQty).toFixed(4);
        await tx
          .update(inventorySchema.stockLevels)
          .set({ reservedQuantity: newReserved, updatedAt: new Date() })
          .where(eq(inventorySchema.stockLevels.id, stockRow.id));

        const [resRow] = await tx
          .insert(inventorySchema.stockReservations)
          .values({
            tenantId: dto.tenantId,
            warehouseId: dto.warehouseId,
            variantId: stockRow.variantId ?? item.productId,
            salesOrderId: dto.salesOrderId,
            reservedQuantity: reqQty.toFixed(4),
            status: 'ACTIVE',
          })
          .returning();

        reservations.push(resRow);
      }

      return { success: true, reservations };
    });
  }

  /**
   * Synchronous RPC (`inventory.get_product_wac`):
   * Returns current Weighted Average Cost and quantity on hand for a product in a warehouse.
   */
  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.GET_PRODUCT_WAC)
  async getProductWac(
    @Payload()
    payload: {
      tenantId: string;
      warehouseId: string;
      productId: string;
    },
  ) {
    const row = await this.lockStockLevelRow(
      this.db,
      payload.tenantId,
      payload.warehouseId,
      payload.productId,
      false,
    );
    return {
      productId: payload.productId,
      warehouseId: payload.warehouseId,
      quantityOnHand: row ? String(row.quantity) : '0.0000',
      unitWacCost: row ? String(row.unitWacCost) : '0.00',
    };
  }

  /**
   * Acquires a row-level lock (`SELECT ... FOR UPDATE`) on `inventory.stock_levels`.
   */
  private async lockStockLevelRow(
    tx: any,
    tenantId: string,
    warehouseId: string,
    productId: string,
    forUpdate = true,
  ): Promise<any | null> {
    if (typeof tx.execute === 'function' && forUpdate) {
      const res = await tx.execute(sql`
        SELECT id, tenant_id AS "tenantId", product_id AS "productId", variant_id AS "variantId",
               warehouse_id AS "warehouseId", quantity, reserved_quantity AS "reservedQuantity",
               unit_wac_cost AS "unitWacCost", batch_number AS "batchNumber"
        FROM inventory.stock_levels
        WHERE tenant_id = ${tenantId}
          AND warehouse_id = ${warehouseId}
          AND (product_id = ${productId} OR variant_id = ${productId})
          AND deleted_at IS NULL
        FOR UPDATE
      `);
      const rows = Array.isArray(res) ? res : (res?.rows ?? []);
      return rows[0] ?? null;
    }

    const rows = await tx
      .select()
      .from(inventorySchema.stockLevels)
      .where(
        and(
          eq(inventorySchema.stockLevels.tenantId, tenantId),
          eq(inventorySchema.stockLevels.warehouseId, warehouseId),
          eq(inventorySchema.stockLevels.productId, productId),
        ),
      );
    return rows[0] ?? null;
  }

  private async loadProductBatches(
    tx: any,
    tenantId: string,
    warehouseId: string,
    productId: string,
  ): Promise<any[]> {
    if (typeof tx.select !== 'function') return [];
    const rows = await tx
      .select()
      .from(inventorySchema.batchesLots)
      .where(
        and(
          eq(inventorySchema.batchesLots.tenantId, tenantId),
          eq(inventorySchema.batchesLots.warehouseId, warehouseId),
          eq(inventorySchema.batchesLots.productId, productId),
        ),
      );
    return Array.isArray(rows) ? rows : [];
  }
}

@Module({
  imports: [DrizzleModule.forService('inventory', inventorySchema)],
  controllers: [InventoryWmsController],
  providers: [OutboxService, InboxService],
})
export class InventoryWmsModule {}

export async function startInventoryWmsService(
  port = Number(process.env.SVC_INVENTORY_HEALTH_PORT || 4005),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-inventory-wms',
    schemaName: 'inventory',
    healthPort: port,
    appModule: InventoryWmsModule,
  });
}

if (require.main === module) {
  startInventoryWmsService().catch((err) => {
    console.error('Failed to start svc-inventory-wms:', err);
    process.exit(1);
  });
}
