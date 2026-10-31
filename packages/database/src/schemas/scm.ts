import { pgSchema, uuid, timestamp, varchar, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenantAuditColumns, moneyColumn, quantityColumn } from '../shared/columns';
import { createOutboxEventsTable, createProcessedEventsTable } from '../shared/outbox';

export const scmSchema = pgSchema('scm');

export const poStatusEnum = scmSchema.enum('po_status', [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_RECEIVED',
  'COMPLETED',
  'CANCELLED',
]);

export const grnStatusEnum = scmSchema.enum('grn_status', [
  'DRAFT',
  'APPROVED',
  'REJECTED',
  // Legacy values for pre-migration compatibility
  'draft',
  'received',
  'cancelled',
]);

export const suppliers = scmSchema.table('suppliers', {
  ...tenantAuditColumns(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  taxRegistrationNumber: varchar('tax_registration_number', { length: 80 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const purchaseRequisitions = scmSchema.table('purchase_requisitions', {
  ...tenantAuditColumns(),
  prNumber: varchar('pr_number', { length: 50 }).notNull(),
  requestedByUserId: uuid('requested_by_user_id').notNull(),
  warehouseId: uuid('warehouse_id').notNull(), // Logical UUID reference to inventory.warehouses
  status: varchar('status', { length: 30 }).default('PENDING').notNull(), // PENDING | APPROVED | CONVERTED | REJECTED
  notes: text('notes'),
});

export const purchaseOrders = scmSchema.table('purchase_orders', {
  ...tenantAuditColumns(),
  poNumber: varchar('po_number', { length: 50 }).notNull(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'restrict' }),
  warehouseId: uuid('warehouse_id').notNull(), // Logical UUID reference to inventory.warehouses
  status: poStatusEnum('status').default('DRAFT').notNull(),
  orderDate: timestamp('order_date').defaultNow().notNull(),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  subtotalAmount: moneyColumn('subtotal_amount').default('0.00').notNull(),
  taxAmount: moneyColumn('tax_amount').default('0.00').notNull(),
  totalAmount: moneyColumn('total_amount').default('0.00').notNull(),
  notes: text('notes'),
});

export const poLines = scmSchema.table('po_lines', {
  ...tenantAuditColumns(),
  purchaseOrderId: uuid('purchase_order_id')
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull(), // Logical UUID reference to inventory.products
  variantId: uuid('variant_id'),           // Logical UUID reference to inventory.product_variants
  sku: varchar('sku', { length: 100 }).notNull(),
  description: text('description'),
  orderedQty: quantityColumn('ordered_qty').notNull(),
  receivedQty: quantityColumn('received_qty').default('0.0000').notNull(),
  unitCost: moneyColumn('unit_cost').notNull(),
  lineTotal: moneyColumn('line_total').notNull(),
});

export const goodsReceivedNotes = scmSchema.table('goods_received_notes', {
  ...tenantAuditColumns(),
  grnNumber: varchar('grn_number', { length: 50 }).notNull(),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'restrict' }),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'restrict' }),
  warehouseId: uuid('warehouse_id'), // Logical UUID reference to inventory.warehouses
  status: grnStatusEnum('status').default('DRAFT').notNull(),
  date: timestamp('date').defaultNow().notNull(),
  total: moneyColumn('total').default('0.00').notNull(),
  notes: text('notes'),
  approvedByUserId: uuid('approved_by_user_id'),
  approvedAt: timestamp('approved_at'),
});

// Backwards-compatible alias for `goodsReceivedNotes`
export const grns = goodsReceivedNotes;

export const grnLines = scmSchema.table('grn_lines', {
  ...tenantAuditColumns(),
  grnId: uuid('grn_id')
    .notNull()
    .references(() => goodsReceivedNotes.id, { onDelete: 'restrict' }),
  poLineId: uuid('po_line_id').references(() => poLines.id, { onDelete: 'restrict' }),
  productId: uuid('product_id'), // Logical UUID reference to inventory.products
  variantId: uuid('variant_id'), // Logical UUID reference to inventory.product_variants
  sku: varchar('sku', { length: 100 }),
  description: text('description').notNull(),
  orderedQty: quantityColumn('ordered_qty').default('0.0000').notNull(),
  quantity: quantityColumn('quantity').default('1.0000').notNull(), // Accepted/Received quantity
  rejectedQty: quantityColumn('rejected_qty').default('0.0000').notNull(),
  unitCost: moneyColumn('unit_cost').default('0.00').notNull(),
  lineTotal: moneyColumn('line_total').default('0.00').notNull(),
  batchNumber: varchar('batch_number', { length: 100 }),
  expiryDate: timestamp('expiry_date'),
});

export const supplierBills = scmSchema.table('supplier_bills', {
  ...tenantAuditColumns(),
  billNumber: varchar('bill_number', { length: 50 }).notNull(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'restrict' }),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id, { onDelete: 'restrict' }),
  grnId: uuid('grn_id').references(() => goodsReceivedNotes.id, { onDelete: 'restrict' }),
  billDate: timestamp('bill_date').defaultNow().notNull(),
  dueDate: timestamp('due_date'),
  totalAmount: moneyColumn('total_amount').notNull(),
  threeWayMatchStatus: varchar('three_way_match_status', { length: 30 }).default('PENDING').notNull(), // PENDING | MATCHED | DISCREPANCY
  status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // DRAFT | APPROVED | PAID
});

export const scmOutboxEvents = createOutboxEventsTable(scmSchema);
export const scmProcessedEvents = createProcessedEventsTable(scmSchema);

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  grns: many(goodsReceivedNotes),
  bills: many(supplierBills),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  lines: many(poLines),
  grns: many(goodsReceivedNotes),
}));

export const poLinesRelations = relations(poLines, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [poLines.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
}));

export const grnsRelations = relations(goodsReceivedNotes, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [goodsReceivedNotes.supplierId],
    references: [suppliers.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [goodsReceivedNotes.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  lines: many(grnLines),
}));

export const grnLinesRelations = relations(grnLines, ({ one }) => ({
  grn: one(goodsReceivedNotes, {
    fields: [grnLines.grnId],
    references: [goodsReceivedNotes.id],
  }),
  poLine: one(poLines, {
    fields: [grnLines.poLineId],
    references: [poLines.id],
  }),
}));

