import { pgSchema, uuid, timestamp, varchar, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenantAuditColumns, moneyColumn, quantityColumn } from '../shared/columns';
import { createOutboxEventsTable, createProcessedEventsTable } from '../shared/outbox';

export const inventorySchema = pgSchema('inventory');

export const stockMovementReasonEnum = inventorySchema.enum('stock_movement_reason', [
  'GRN_RECEIPT',
  'SALES_DISPATCH',
  'PRODUCTION_RAW_CONSUME',
  'PRODUCTION_FG_YIELD',
  'WAREHOUSE_TRANSFER',
  'STOCK_ADJUSTMENT',
]);

export const products = inventorySchema.table('products', {
  ...tenantAuditColumns(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  brand: varchar('brand', { length: 100 }),
  imageUrl: text('image_url'),
  reorderThreshold: quantityColumn('reorder_threshold').default('10.0000').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const productVariants = inventorySchema.table('product_variants', {
  ...tenantAuditColumns(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  sku: varchar('sku', { length: 100 }).notNull(),
  barcode: varchar('barcode', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  price: moneyColumn('price').default('0.00').notNull(),
  cost: moneyColumn('cost').default('0.00').notNull(),
  wacCost: moneyColumn('wac_cost').default('0.00').notNull(), // Weighted Average Cost
  isActive: boolean('is_active').default(true).notNull(),
});

export const warehouses = inventorySchema.table('warehouses', {
  ...tenantAuditColumns(),
  code: varchar('code', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  location: text('location'),
  branchId: uuid('branch_id'), // Logical UUID reference to iam.branches
  isActive: boolean('is_active').default(true).notNull(),
});

export const binLocations = inventorySchema.table('bin_locations', {
  ...tenantAuditColumns(),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id, { onDelete: 'restrict' }),
  code: varchar('code', { length: 60 }).notNull(), // e.g., 'AISLE-01-RACK-02-BIN-A'
  description: varchar('description', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const batchesLots = inventorySchema.table('batches_lots', {
  ...tenantAuditColumns(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'restrict' }),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id, { onDelete: 'restrict' }),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(),
  manufacturedDate: timestamp('manufactured_date'),
  expiryDate: timestamp('expiry_date'), // Used for FEFO (First Expired, First Out) allocation
  quantityAvailable: quantityColumn('quantity_available').default('0.0000').notNull(),
  unitCost: moneyColumn('unit_cost').default('0.00').notNull(),
});

export const stockLevels = inventorySchema.table('stock_levels', {
  ...tenantAuditColumns(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id')
    .notNull()
    .references(() => productVariants.id, { onDelete: 'restrict' }),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id, { onDelete: 'restrict' }),
  binLocationId: uuid('bin_location_id').references(() => binLocations.id, { onDelete: 'set null' }),
  quantity: quantityColumn('quantity').default('0.0000').notNull(), // Quantity on hand
  reservedQuantity: quantityColumn('reserved_quantity').default('0.0000').notNull(),
  unitWacCost: moneyColumn('unit_wac_cost').default('0.00').notNull(),
  batchNumber: varchar('batch_number', { length: 100 }),
  expirationDate: timestamp('expiration_date'),
});

/**
 * Immutable Stock Movement Ledger per GEMINI.md Rule 3.
 * `stock_levels.quantity` MUST NEVER be mutated without inserting a row into `stock_movements`
 * inside the same ACID transaction with `SELECT ... FOR UPDATE` row locking.
 */
export const stockMovements = inventorySchema.table('stock_movements', {
  ...tenantAuditColumns(),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id')
    .notNull()
    .references(() => productVariants.id, { onDelete: 'restrict' }),
  reason: stockMovementReasonEnum('reason').notNull(),
  referenceDocumentId: uuid('reference_document_id').notNull(), // Idempotency key with reason + variantId
  batchNumber: varchar('batch_number', { length: 100 }),
  quantityDelta: quantityColumn('quantity_delta').notNull(), // Positive for receipts, negative for dispatches
  balanceAfter: quantityColumn('balance_after').notNull(),
  unitCostAtMovement: moneyColumn('unit_cost_at_movement').default('0.00').notNull(),
  totalValuationDelta: moneyColumn('total_valuation_delta').default('0.00').notNull(),
  actorUserId: uuid('actor_user_id'),
  notes: text('notes'),
});

export const stockReservations = inventorySchema.table('stock_reservations', {
  ...tenantAuditColumns(),
  warehouseId: uuid('warehouse_id')
    .notNull()
    .references(() => warehouses.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id')
    .notNull()
    .references(() => productVariants.id, { onDelete: 'restrict' }),
  salesOrderId: uuid('sales_order_id').notNull(), // Logical UUID reference to sales_crm.sales_orders
  reservedQuantity: quantityColumn('reserved_quantity').notNull(),
  status: varchar('status', { length: 30 }).default('ACTIVE').notNull(), // ACTIVE | CONSUMED | RELEASED
  expiresAt: timestamp('expires_at'),
});

export const stockTransfers = inventorySchema.table('stock_transfers', {
  ...tenantAuditColumns(),
  transferNumber: varchar('transfer_number', { length: 50 }).notNull(),
  sourceWarehouseId: uuid('source_warehouse_id')
    .notNull()
    .references(() => warehouses.id, { onDelete: 'restrict' }),
  targetWarehouseId: uuid('target_warehouse_id')
    .notNull()
    .references(() => warehouses.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id')
    .notNull()
    .references(() => productVariants.id, { onDelete: 'restrict' }),
  quantity: quantityColumn('quantity').notNull(),
  batchNumber: varchar('batch_number', { length: 100 }),
  status: varchar('status', { length: 30 }).default('COMPLETED').notNull(),
});

export const inventoryOutboxEvents = createOutboxEventsTable(inventorySchema);
export const inventoryProcessedEvents = createProcessedEventsTable(inventorySchema);

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  batches: many(batchesLots),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  stockLevels: many(stockLevels),
  movements: many(stockMovements),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  bins: many(binLocations),
  stockLevels: many(stockLevels),
  movements: many(stockMovements),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  variant: one(productVariants, {
    fields: [stockLevels.variantId],
    references: [productVariants.id],
  }),
  warehouse: one(warehouses, {
    fields: [stockLevels.warehouseId],
    references: [warehouses.id],
  }),
}));

