import { randomUUID } from 'node:crypto';
import Decimal from 'decimal.js';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import {
  AdjustStockDto,
  AdjustStockSchema,
  AtomicStockMutationDto,
  AtomicStockMutationResponse,
  AtomicStockMutationSchema,
  CreateProductDto,
  CreateProductSchema,
  ERP_EVENT_PATTERNS,
  ERP_RPC_PATTERNS,
  EventEnvelope,
  GrnApprovedEvent,
  GrnApprovedEventSchema,
  LowStockThresholdBreachedEventSchema,
  SoftDeleteProductDto,
  SoftDeleteProductSchema,
  StockReservationDto,
  StockReservationSchema,
  UpdateProductDto,
  UpdateProductSchema,
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
   * BullMQ Durable Consumer (`event.scm.grn_approved`):
   * Idempotently increments stock, recalculates Weighted Average Cost (WAC),
   * records batch/lot expiry, and writes immutable `inventory.stock_movements` rows.
   */
  @EventPattern(ERP_EVENT_PATTERNS.GRN_APPROVED)
  async handleGrnApproved(@Payload() envelope: EventEnvelope<GrnApprovedEvent>) {
    const event = GrnApprovedEventSchema.parse(envelope.payload);

    return this.inboxService.consumeIdempotently(
      this.db,
      inventorySchema.inventoryProcessedEvents,
      'svc-inventory-wms',
      envelope,
      async () => {
        return this.atomicStockIncrement({
          tenantId: event.tenantId,
          branchId: event.branchId,
          actorUserId: event.actorUserId,
          correlationId: event.correlationId,
          warehouseId: event.warehouseId,
          referenceDocumentId: event.grnId,
          reason: 'GRN_RECEIPT',
          items: event.lines.map((l) => ({
            productId: l.productId,
            sku: l.sku,
            quantity: l.receivedQty,
            unitCost: l.unitCost,
            batchNumber: l.batchNumber,
            expiryDate: l.expiryDate,
          })),
        });
      },
    );
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
          isNull(inventorySchema.stockLevels.deletedAt),
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
          isNull(inventorySchema.batchesLots.deletedAt),
        ),
      );
    return Array.isArray(rows) ? rows : [];
  }

  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_WAREHOUSES)
  async listWarehouses(@Payload() rawPayload: { tenantId: string }) {
    return this.db
      .select()
      .from(inventorySchema.warehouses)
      .where(
        and(
          eq(inventorySchema.warehouses.tenantId, rawPayload.tenantId),
          isNull(inventorySchema.warehouses.deletedAt),
        ),
      );
  }

  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_PRODUCTS)
  async listProducts(@Payload() rawPayload: { tenantId: string }) {
    const prodRows = await this.db
      .select()
      .from(inventorySchema.products)
      .where(
        and(
          eq(inventorySchema.products.tenantId, rawPayload.tenantId),
          isNull(inventorySchema.products.deletedAt),
        ),
      );

    const variantRows = await this.db
      .select()
      .from(inventorySchema.productVariants)
      .where(
        and(
          eq(inventorySchema.productVariants.tenantId, rawPayload.tenantId),
          isNull(inventorySchema.productVariants.deletedAt),
        ),
      );

    const stockRows = await this.db
      .select()
      .from(inventorySchema.stockLevels)
      .where(
        and(
          eq(inventorySchema.stockLevels.tenantId, rawPayload.tenantId),
          isNull(inventorySchema.stockLevels.deletedAt),
        ),
      );

    return prodRows.map((p: any) => {
      const variants = variantRows.filter((v: any) => v.productId === p.id);
      const primary = variants[0];
      const matchingStock = stockRows.filter(
        (s: any) => s.productId === p.id || (primary && s.variantId === primary.id),
      );

      let totalQty = new Decimal(0);
      let totalReserved = new Decimal(0);
      let latestWac = new Decimal(primary?.wacCost || primary?.cost || '0');

      for (const s of matchingStock) {
        totalQty = totalQty.plus(new Decimal(s.quantity || '0'));
        totalReserved = totalReserved.plus(new Decimal(s.reservedQuantity || '0'));
        if (new Decimal(s.unitWacCost || '0').gt(0)) {
          latestWac = new Decimal(s.unitWacCost);
        }
      }

      return {
        id: p.id,
        variantId: primary?.id ?? p.id,
        sku: primary?.sku || `SKU-${p.id.slice(0, 8)}`,
        name: p.name,
        description: p.description ?? '',
        category: p.category ?? 'General',
        brand: p.brand ?? 'Zynveo',
        price: primary?.price ?? '0.00',
        cost: primary?.cost ?? '0.00',
        wacCost: latestWac.toFixed(2),
        stock: totalQty.toFixed(4),
        reserved: totalReserved.toFixed(4),
        reorderThreshold: String(p.reorderThreshold || '10.0000'),
        isActive: p.isActive,
      };
    });
  }

  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.CREATE_PRODUCT)
  async createProduct(@Payload() rawPayload: CreateProductDto) {
    const dto = CreateProductSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const [product] = await tx
        .insert(inventorySchema.products)
        .values({
          tenantId: dto.tenantId,
          name: dto.name,
          description: dto.description ?? null,
          category: dto.category ?? 'General',
          brand: dto.brand ?? 'Zynveo',
          reorderThreshold: new Decimal(dto.reorderThreshold).toFixed(4),
          isActive: true,
        })
        .returning();

      const price = new Decimal(dto.price).toFixed(2);
      const cost = new Decimal(dto.cost).toFixed(2);

      const [variant] = await tx
        .insert(inventorySchema.productVariants)
        .values({
          tenantId: dto.tenantId,
          productId: product.id,
          sku: dto.sku,
          name: dto.name,
          price,
          cost,
          wacCost: cost,
          isActive: true,
        })
        .returning();

      const initQty = new Decimal(dto.initialStock || '0');
      if (initQty.gt(0)) {
        let targetWhId = dto.warehouseId;
        if (!targetWhId) {
          const whs = await tx
            .select()
            .from(inventorySchema.warehouses)
            .where(
              and(
                eq(inventorySchema.warehouses.tenantId, dto.tenantId),
                isNull(inventorySchema.warehouses.deletedAt),
              ),
            );
          if (whs[0]) {
            targetWhId = whs[0].id;
          } else {
            const [createdWh] = await tx
              .insert(inventorySchema.warehouses)
              .values({
                tenantId: dto.tenantId,
                code: 'WH-MAIN-01',
                name: 'Main Warehouse',
                isActive: true,
              })
              .returning();
            targetWhId = createdWh.id;
          }
        }

        const totalVal = initQty.mul(new Decimal(cost)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
        await tx.insert(inventorySchema.stockLevels).values({
          tenantId: dto.tenantId,
          productId: product.id,
          variantId: variant.id,
          warehouseId: targetWhId,
          quantity: initQty.toFixed(4),
          reservedQuantity: '0.0000',
          unitWacCost: cost,
        });

        await tx.insert(inventorySchema.stockMovements).values({
          tenantId: dto.tenantId,
          warehouseId: targetWhId,
          productId: product.id,
          variantId: variant.id,
          reason: 'STOCK_ADJUSTMENT',
          referenceDocumentId: product.id,
          quantityDelta: initQty.toFixed(4),
          balanceAfter: initQty.toFixed(4),
          unitCostAtMovement: cost,
          totalValuationDelta: totalVal,
          actorUserId: dto.actorUserId,
          notes: `Initial opening stock for SKU ${dto.sku}`,
        });
      }

      return {
        id: product.id,
        variantId: variant.id,
        sku: variant.sku,
        name: product.name,
        category: product.category,
        brand: product.brand,
        price: variant.price,
        cost: variant.cost,
        wacCost: variant.wacCost,
        stock: initQty.toFixed(4),
        reserved: '0.0000',
        reorderThreshold: product.reorderThreshold,
        isActive: product.isActive,
      };
    });
  }

  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.UPDATE_PRODUCT)
  async updateProduct(@Payload() rawPayload: UpdateProductDto) {
    const dto = UpdateProductSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const existing = await tx
        .select()
        .from(inventorySchema.products)
        .where(
          and(
            eq(inventorySchema.products.id, dto.productId),
            eq(inventorySchema.products.tenantId, dto.tenantId),
            isNull(inventorySchema.products.deletedAt),
          ),
        );

      if (!existing[0]) {
        throw new ErpRpcException('PRODUCT_NOT_FOUND', `Product ${dto.productId} not found`, 404);
      }

      const prodUpdates: Record<string, unknown> = { updatedAt: new Date() };
      if (dto.name !== undefined) prodUpdates.name = dto.name;
      if (dto.description !== undefined) prodUpdates.description = dto.description;
      if (dto.category !== undefined) prodUpdates.category = dto.category;
      if (dto.brand !== undefined) prodUpdates.brand = dto.brand;
      if (dto.reorderThreshold !== undefined) {
        prodUpdates.reorderThreshold = new Decimal(dto.reorderThreshold).toFixed(4);
      }
      if (dto.isActive !== undefined) prodUpdates.isActive = dto.isActive;

      const [updatedProd] = await tx
        .update(inventorySchema.products)
        .set(prodUpdates)
        .where(
          and(
            eq(inventorySchema.products.id, dto.productId),
            eq(inventorySchema.products.tenantId, dto.tenantId),
          ),
        )
        .returning();

      const varUpdates: Record<string, unknown> = { updatedAt: new Date() };
      if (dto.sku !== undefined) varUpdates.sku = dto.sku;
      if (dto.name !== undefined) varUpdates.name = dto.name;
      if (dto.price !== undefined) varUpdates.price = new Decimal(dto.price).toFixed(2);
      if (dto.cost !== undefined) varUpdates.cost = new Decimal(dto.cost).toFixed(2);
      if (dto.isActive !== undefined) varUpdates.isActive = dto.isActive;

      await tx
        .update(inventorySchema.productVariants)
        .set(varUpdates)
        .where(
          and(
            eq(inventorySchema.productVariants.productId, dto.productId),
            eq(inventorySchema.productVariants.tenantId, dto.tenantId),
          ),
        );

      return { success: true, productId: updatedProd.id, name: updatedProd.name };
    });
  }

  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.SOFT_DELETE_PRODUCT)
  async softDeleteProduct(@Payload() rawPayload: SoftDeleteProductDto) {
    const dto = SoftDeleteProductSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const now = new Date();
      const [updated] = await tx
        .update(inventorySchema.products)
        .set({ deletedAt: now, isActive: false, updatedAt: now })
        .where(
          and(
            eq(inventorySchema.products.id, dto.productId),
            eq(inventorySchema.products.tenantId, dto.tenantId),
            isNull(inventorySchema.products.deletedAt),
          ),
        )
        .returning();

      if (!updated) {
        throw new ErpRpcException('PRODUCT_NOT_FOUND', `Product ${dto.productId} not found`, 404);
      }

      await tx
        .update(inventorySchema.productVariants)
        .set({ deletedAt: now, isActive: false, updatedAt: now })
        .where(
          and(
            eq(inventorySchema.productVariants.productId, dto.productId),
            eq(inventorySchema.productVariants.tenantId, dto.tenantId),
          ),
        );

      return { success: true, productId: dto.productId, deletedAt: now.toISOString() };
    });
  }

  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_STOCK_LEVELS)
  async listStockLevels(@Payload() rawPayload: { tenantId: string }) {
    return this.db
      .select({
        id: inventorySchema.stockLevels.id,
        warehouseId: inventorySchema.stockLevels.warehouseId,
        warehouseName: inventorySchema.warehouses.name,
        warehouseCode: inventorySchema.warehouses.code,
        productId: inventorySchema.stockLevels.productId,
        productName: inventorySchema.products.name,
        variantId: inventorySchema.stockLevels.variantId,
        sku: inventorySchema.productVariants.sku,
        quantity: inventorySchema.stockLevels.quantity,
        reservedQuantity: inventorySchema.stockLevels.reservedQuantity,
        unitWacCost: inventorySchema.stockLevels.unitWacCost,
        batchNumber: inventorySchema.stockLevels.batchNumber,
      })
      .from(inventorySchema.stockLevels)
      .leftJoin(inventorySchema.warehouses, eq(inventorySchema.stockLevels.warehouseId, inventorySchema.warehouses.id))
      .leftJoin(inventorySchema.products, eq(inventorySchema.stockLevels.productId, inventorySchema.products.id))
      .leftJoin(inventorySchema.productVariants, eq(inventorySchema.stockLevels.variantId, inventorySchema.productVariants.id))
      .where(
        and(
          eq(inventorySchema.stockLevels.tenantId, rawPayload.tenantId),
          isNull(inventorySchema.stockLevels.deletedAt),
        ),
      );
  }

  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_STOCK_MOVEMENTS)
  async listStockMovements(@Payload() rawPayload: { tenantId: string }) {
    return this.db
      .select({
        id: inventorySchema.stockMovements.id,
        warehouseId: inventorySchema.stockMovements.warehouseId,
        warehouseCode: inventorySchema.warehouses.code,
        productId: inventorySchema.stockMovements.productId,
        productName: inventorySchema.products.name,
        reason: inventorySchema.stockMovements.reason,
        referenceDocumentId: inventorySchema.stockMovements.referenceDocumentId,
        batchNumber: inventorySchema.stockMovements.batchNumber,
        quantityDelta: inventorySchema.stockMovements.quantityDelta,
        balanceAfter: inventorySchema.stockMovements.balanceAfter,
        unitCostAtMovement: inventorySchema.stockMovements.unitCostAtMovement,
        totalValuationDelta: inventorySchema.stockMovements.totalValuationDelta,
        notes: inventorySchema.stockMovements.notes,
        createdAt: inventorySchema.stockMovements.createdAt,
      })
      .from(inventorySchema.stockMovements)
      .leftJoin(inventorySchema.warehouses, eq(inventorySchema.stockMovements.warehouseId, inventorySchema.warehouses.id))
      .leftJoin(inventorySchema.products, eq(inventorySchema.stockMovements.productId, inventorySchema.products.id))
      .where(
        and(
          eq(inventorySchema.stockMovements.tenantId, rawPayload.tenantId),
          isNull(inventorySchema.stockMovements.deletedAt),
        ),
      )
      .orderBy(desc(inventorySchema.stockMovements.createdAt));
  }

  @MessagePattern(ERP_RPC_PATTERNS.INVENTORY_WMS.ADJUST_STOCK)
  async adjustStock(@Payload() rawPayload: AdjustStockDto): Promise<AtomicStockMutationResponse> {
    const dto = AdjustStockSchema.parse(rawPayload);
    const delta = new Decimal(dto.quantityDelta);

    const variants = await this.db
      .select()
      .from(inventorySchema.productVariants)
      .where(
        and(
          eq(inventorySchema.productVariants.tenantId, dto.tenantId),
          eq(inventorySchema.productVariants.productId, dto.productId),
          isNull(inventorySchema.productVariants.deletedAt),
        ),
      );

    const sku = variants[0]?.sku || `SKU-${dto.productId.slice(0, 8)}`;
    const absQty = delta.abs().toFixed(4);
    const refDocId = randomUUID();

    if (delta.gt(0)) {
      return this.atomicStockIncrement({
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        actorUserId: dto.actorUserId,
        correlationId: dto.correlationId,
        warehouseId: dto.warehouseId,
        referenceDocumentId: refDocId,
        reason: 'STOCK_ADJUSTMENT',
        items: [
          {
            productId: dto.productId,
            sku,
            quantity: absQty,
            unitCost: dto.unitCost ?? variants[0]?.wacCost ?? variants[0]?.cost ?? '0.00',
          },
        ],
      });
    }

    return this.atomicStockDecrement({
      tenantId: dto.tenantId,
      branchId: dto.branchId,
      actorUserId: dto.actorUserId,
      correlationId: dto.correlationId,
      warehouseId: dto.warehouseId,
      referenceDocumentId: refDocId,
      reason: 'STOCK_ADJUSTMENT',
      items: [
        {
          productId: dto.productId,
          sku,
          quantity: absQty,
        },
      ],
    });
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
