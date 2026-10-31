import { pgSchema, uuid, timestamp, varchar, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenantAuditColumns, moneyColumn, quantityColumn, percentColumn } from '../shared/columns';
import { createOutboxEventsTable, createProcessedEventsTable } from '../shared/outbox';

export const mfgSchema = pgSchema('manufacturing');
export const manufacturingSchema = mfgSchema;

export const workOrderStatusEnum = mfgSchema.enum('work_order_status', [
  'DRAFT',
  'RELEASED',
  'IN_PROGRESS',
  'QA_CHECK',
  'COMPLETED',
  'CANCELLED',
]);

export const billsOfMaterials = mfgSchema.table('bills_of_materials', {
  ...tenantAuditColumns(),
  finishedProductId: uuid('finished_product_id').notNull(), // Logical UUID reference to inventory.products
  bomCode: varchar('bom_code', { length: 60 }).notNull(),
  version: varchar('version', { length: 20 }).notNull().default('1.0'),
  laborCostPerUnit: moneyColumn('labor_cost_per_unit').notNull().default('0.00'),
  overheadCostPerUnit: moneyColumn('overhead_cost_per_unit').notNull().default('0.00'),
  isActive: boolean('is_active').default(true).notNull(),
});

export const bomItems = mfgSchema.table('bom_items', {
  ...tenantAuditColumns(),
  bomId: uuid('bom_id')
    .notNull()
    .references(() => billsOfMaterials.id, { onDelete: 'restrict' }),
  rawMaterialProductId: uuid('raw_material_product_id').notNull(), // Logical UUID reference to inventory.products
  rawMaterialVariantId: uuid('raw_material_variant_id'),           // Logical UUID reference to inventory.product_variants
  quantityRequiredPerUnit: quantityColumn('quantity_required_per_unit').notNull(),
  scrapPercentage: percentColumn('scrap_percentage').default('0.00').notNull(),
});

export const workCenters = mfgSchema.table('work_centers', {
  ...tenantAuditColumns(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  hourlyRate: moneyColumn('hourly_rate').default('0.00').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const workOrders = mfgSchema.table('work_orders', {
  ...tenantAuditColumns(),
  workOrderNumber: varchar('work_order_number', { length: 50 }).notNull(),
  bomId: uuid('bom_id')
    .notNull()
    .references(() => billsOfMaterials.id, { onDelete: 'restrict' }),
  workCenterId: uuid('work_center_id').references(() => workCenters.id, { onDelete: 'set null' }),
  finishedProductId: uuid('finished_product_id').notNull(),       // Logical UUID reference to inventory.products
  sourceRawWarehouseId: uuid('source_raw_warehouse_id').notNull(), // Logical UUID reference to inventory.warehouses
  targetFinishedWarehouseId: uuid('target_finished_warehouse_id').notNull(),
  plannedQty: quantityColumn('planned_qty').notNull(),
  actualProducedQty: quantityColumn('actual_produced_qty').default('0.0000').notNull(),
  outputBatchNumber: varchar('output_batch_number', { length: 100 }),
  rawMaterialCostTotal: moneyColumn('raw_material_cost_total').default('0.00').notNull(),
  laborCostTotal: moneyColumn('labor_cost_total').default('0.00').notNull(),
  overheadCostTotal: moneyColumn('overhead_cost_total').default('0.00').notNull(),
  totalProductionCost: moneyColumn('total_production_cost').default('0.00').notNull(),
  status: workOrderStatusEnum('status').default('DRAFT').notNull(),
  scheduledStartDate: timestamp('scheduled_start_date'),
  completedAt: timestamp('completed_at'),
});

export const materialConsumptions = mfgSchema.table('material_consumptions', {
  ...tenantAuditColumns(),
  workOrderId: uuid('work_order_id')
    .notNull()
    .references(() => workOrders.id, { onDelete: 'restrict' }),
  rawMaterialProductId: uuid('raw_material_product_id').notNull(),
  consumedQuantity: quantityColumn('consumed_quantity').notNull(),
  unitCost: moneyColumn('unit_cost').default('0.00').notNull(),
  totalCost: moneyColumn('total_cost').default('0.00').notNull(),
  batchNumber: varchar('batch_number', { length: 100 }),
});

export const qualityChecks = mfgSchema.table('quality_checks', {
  ...tenantAuditColumns(),
  workOrderId: uuid('work_order_id')
    .notNull()
    .references(() => workOrders.id, { onDelete: 'restrict' }),
  inspectorUserId: uuid('inspector_user_id').notNull(),
  passedQty: quantityColumn('passed_qty').notNull(),
  rejectedQty: quantityColumn('rejected_qty').default('0.0000').notNull(),
  status: varchar('status', { length: 30 }).default('PASSED').notNull(), // PASSED | FAILED
  notes: text('notes'),
});

export const manufacturingOutboxEvents = createOutboxEventsTable(mfgSchema);
export const manufacturingProcessedEvents = createProcessedEventsTable(mfgSchema);

export const billsOfMaterialsRelations = relations(billsOfMaterials, ({ many }) => ({
  items: many(bomItems),
  workOrders: many(workOrders),
}));

export const bomItemsRelations = relations(bomItems, ({ one }) => ({
  bom: one(billsOfMaterials, {
    fields: [bomItems.bomId],
    references: [billsOfMaterials.id],
  }),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  bom: one(billsOfMaterials, {
    fields: [workOrders.bomId],
    references: [billsOfMaterials.id],
  }),
  consumptions: many(materialConsumptions),
  qualityChecks: many(qualityChecks),
}));

