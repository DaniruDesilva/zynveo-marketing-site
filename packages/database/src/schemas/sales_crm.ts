import { pgSchema, uuid, timestamp, varchar, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenantAuditColumns, moneyColumn, quantityColumn, percentColumn } from '../shared/columns';
import { createOutboxEventsTable, createProcessedEventsTable } from '../shared/outbox';

export const salesCrmSchema = pgSchema('sales_crm');

export const ticketSeverityEnum = salesCrmSchema.enum('ticket_severity', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
  // Legacy values for pre-migration compatibility
  'low',
  'medium',
  'high',
  'critical',
]);

export const ticketStatusEnum = salesCrmSchema.enum('ticket_status', [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

export const invoiceStatusEnum = salesCrmSchema.enum('invoice_status', [
  'DRAFT',
  'FINALIZING',
  'FINALIZED',
  'PAID',
  'VOIDED',
]);

export const documentTypeEnum = salesCrmSchema.enum('document_type', [
  'QUOTE',
  'INVOICE',
  'CREDIT_NOTE',
  'quote',
  'invoice',
  'credit_note',
]);

export const documentStatusEnum = salesCrmSchema.enum('document_status', [
  'DRAFT',
  'FINALIZING',
  'FINALIZED',
  'SENT',
  'PAID',
  'VOIDED',
  'PARTIALLY_PAID',
  'draft',
  'sent',
  'paid',
  'void',
  'partially_paid',
]);

export const projectStatusEnum = salesCrmSchema.enum('project_status', [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled',
]);

export const rentalStatusEnum = salesCrmSchema.enum('rental_status', [
  'RESERVED',
  'RENTED',
  'RETURNED',
  'OVERDUE',
  'reserved',
  'rented',
  'returned',
  'overdue',
]);

export const leads = salesCrmSchema.table('leads', {
  ...tenantAuditColumns(),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  source: varchar('source', { length: 100 }),
  status: varchar('status', { length: 40 }).default('NEW').notNull(), // NEW | QUALIFIED | CONVERTED | LOST
  estimatedValue: moneyColumn('estimated_value').default('0.00').notNull(),
  assignedUserId: uuid('assigned_user_id'),
});

export const customers = salesCrmSchema.table('customers', {
  ...tenantAuditColumns(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  company: varchar('company', { length: 255 }),
  tier: varchar('tier', { length: 50 }).default('STANDARD'),
  creditLimit: moneyColumn('credit_limit').default('100000.00').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const communicationLogs = salesCrmSchema.table('communication_logs', {
  ...tenantAuditColumns(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  type: varchar('type', { length: 50 }).notNull(),
  notes: text('notes'),
  date: timestamp('date').defaultNow().notNull(),
});

export const complaintTickets = salesCrmSchema.table('complaint_tickets', {
  ...tenantAuditColumns(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description'),
  severity: ticketSeverityEnum('severity').default('LOW').notNull(),
  status: ticketStatusEnum('status').default('OPEN').notNull(),
  slaDeadline: timestamp('sla_deadline'),
  resolutionNotes: text('resolution_notes'),
});

export const slaTickets = complaintTickets;

export const quotations = salesCrmSchema.table('quotations', {
  ...tenantAuditColumns(),
  quoteNumber: varchar('quote_number', { length: 50 }).notNull(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  validUntil: timestamp('valid_until'),
  subtotalAmount: moneyColumn('subtotal_amount').default('0.00').notNull(),
  discountAmount: moneyColumn('discount_amount').default('0.00').notNull(),
  taxAmount: moneyColumn('tax_amount').default('0.00').notNull(),
  totalAmount: moneyColumn('total_amount').default('0.00').notNull(),
  status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // DRAFT | SENT | ACCEPTED | CONVERTED
  notes: text('notes'),
});

export const salesOrders = salesCrmSchema.table('sales_orders', {
  ...tenantAuditColumns(),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  quotationId: uuid('quotation_id').references(() => quotations.id, { onDelete: 'set null' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  warehouseId: uuid('warehouse_id').notNull(), // Logical UUID reference to inventory.warehouses
  subtotalAmount: moneyColumn('subtotal_amount').default('0.00').notNull(),
  discountAmount: moneyColumn('discount_amount').default('0.00').notNull(),
  taxAmount: moneyColumn('tax_amount').default('0.00').notNull(),
  totalAmount: moneyColumn('total_amount').default('0.00').notNull(),
  status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // DRAFT | CONFIRMED | DISPATCHED | INVOICED
});

export const invoices = salesCrmSchema.table('invoices', {
  ...tenantAuditColumns(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  salesOrderId: uuid('sales_order_id').references(() => salesOrders.id, { onDelete: 'set null' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  warehouseId: uuid('warehouse_id').notNull(), // Logical UUID reference to inventory.warehouses
  currency: varchar('currency', { length: 3 }).default('LKR').notNull(),
  invoiceDate: timestamp('invoice_date').defaultNow().notNull(),
  dueDate: timestamp('due_date'),
  subtotalAmount: moneyColumn('subtotal_amount').default('0.00').notNull(),
  discountAmount: moneyColumn('discount_amount').default('0.00').notNull(),
  taxAmount: moneyColumn('tax_amount').default('0.00').notNull(),
  totalAmount: moneyColumn('total_amount').default('0.00').notNull(),
  totalCogsAmount: moneyColumn('total_cogs_amount').default('0.00').notNull(),
  status: invoiceStatusEnum('status').default('DRAFT').notNull(),
  journalEntryId: uuid('journal_entry_id'), // Logical UUID reference to finance.journal_entries
  notes: text('notes'),
  terms: text('terms'),
});

export const invoiceLines = salesCrmSchema.table('invoice_lines', {
  ...tenantAuditColumns(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'restrict' }),
  productId: uuid('product_id').notNull(), // Logical UUID reference to inventory.products
  variantId: uuid('variant_id'),           // Logical UUID reference to inventory.product_variants
  sku: varchar('sku', { length: 100 }).notNull(),
  description: text('description').notNull(),
  quantity: quantityColumn('quantity').default('1.0000').notNull(),
  unitPrice: moneyColumn('unit_price').default('0.00').notNull(),
  discountAmount: moneyColumn('discount_amount').default('0.00').notNull(),
  taxRatePercent: percentColumn('tax_rate_percent').default('0.00').notNull(),
  taxAmount: moneyColumn('tax_amount').default('0.00').notNull(),
  lineTotal: moneyColumn('line_total').default('0.00').notNull(),
});

export const creditNotes = salesCrmSchema.table('credit_notes', {
  ...tenantAuditColumns(),
  creditNoteNumber: varchar('credit_note_number', { length: 50 }).notNull(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'restrict' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  reason: text('reason').notNull(),
  totalCreditAmount: moneyColumn('total_credit_amount').notNull(),
  status: varchar('status', { length: 30 }).default('ISSUED').notNull(),
});

/**
 * Legacy `documents` & `document_lines` tables migrated into `sales_crm`
 * so existing `core-invoicing`, `core-reporting`, and PowerSync queries continue working.
 */
export const documents = salesCrmSchema.table('documents', {
  ...tenantAuditColumns(),
  type: documentTypeEnum('type').notNull(),
  documentNumber: varchar('document_number', { length: 50 }).notNull(),
  status: documentStatusEnum('status').default('draft').notNull(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'restrict' }),
  warehouseId: uuid('warehouse_id'),
  date: timestamp('date').notNull(),
  dueDate: timestamp('due_date'),
  subtotal: moneyColumn('subtotal').default('0.00').notNull(),
  taxTotal: moneyColumn('tax_total').default('0.00').notNull(),
  discountTotal: moneyColumn('discount_total').default('0.00').notNull(),
  total: moneyColumn('total').default('0.00').notNull(),
  totalCogs: moneyColumn('total_cogs').default('0.00').notNull(),
  notes: text('notes'),
  terms: text('terms'),
  linkedDocumentId: uuid('linked_document_id'),
  journalEntryId: uuid('journal_entry_id'), // Logical UUID reference to finance.journal_entries
});

export const documentLines = salesCrmSchema.table('document_lines', {
  ...tenantAuditColumns(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'restrict' }),
  productId: uuid('product_id'), // Logical UUID reference to inventory.products
  variantId: uuid('variant_id'), // Logical UUID reference to inventory.product_variants
  sku: varchar('sku', { length: 100 }),
  description: text('description').notNull(),
  quantity: quantityColumn('quantity').default('1.0000').notNull(),
  unitPrice: moneyColumn('unit_price').default('0.00').notNull(),
  discount: moneyColumn('discount').default('0.00').notNull(),
  taxRate: percentColumn('tax_rate').default('0.00').notNull(),
  lineTotal: moneyColumn('line_total').default('0.00').notNull(),
});

/**
 * Projects & Rentals tables parked inside `sales_crm` per Architecture Decision #4.
 */
export const projects = salesCrmSchema.table('projects', {
  ...tenantAuditColumns(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('PLANNING').notNull(),
  budget: moneyColumn('budget').default('0.00'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
});

export const tasks = salesCrmSchema.table('tasks', {
  ...tenantAuditColumns(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('TODO').notNull(),
  estimatedHours: quantityColumn('estimated_hours'),
  loggedHours: quantityColumn('logged_hours').default('0.0000'),
  dueDate: timestamp('due_date'),
});

export const rentalAssets = salesCrmSchema.table('rental_assets', {
  ...tenantAuditColumns(),
  name: varchar('name', { length: 255 }).notNull(),
  serialNumber: varchar('serial_number', { length: 100 }),
  dailyRate: moneyColumn('daily_rate').notNull(),
  status: varchar('status', { length: 50 }).default('AVAILABLE').notNull(),
});

export const rentals = salesCrmSchema.table('rentals', {
  ...tenantAuditColumns(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'restrict' }),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => rentalAssets.id, { onDelete: 'restrict' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  status: rentalStatusEnum('status').default('RESERVED').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  totalCost: moneyColumn('total_cost'),
});

export const salesCrmOutboxEvents = createOutboxEventsTable(salesCrmSchema);
export const salesCrmProcessedEvents = createProcessedEventsTable(salesCrmSchema);

export const customersRelations = relations(customers, ({ many }) => ({
  logs: many(communicationLogs),
  tickets: many(complaintTickets),
  invoices: many(invoices),
  documents: many(documents),
  projects: many(projects),
  rentals: many(rentals),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  lines: many(invoiceLines),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
  lines: many(documentLines),
}));

export const documentLinesRelations = relations(documentLines, ({ one }) => ({
  document: one(documents, {
    fields: [documentLines.documentId],
    references: [documents.id],
  }),
}));

