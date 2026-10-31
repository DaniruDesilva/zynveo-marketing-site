import { pgSchema, uuid, timestamp, varchar, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenantAuditColumns, moneyColumn, percentColumn } from '../shared/columns';
import { createOutboxEventsTable, createProcessedEventsTable } from '../shared/outbox';

export const financeSchema = pgSchema('finance');

export const accountTypeEnum = financeSchema.enum('account_type', [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
  // Legacy lowercase values kept for compatibility with pre-migration code until Phase 4
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense',
]);

export const accountNormalBalanceEnum = financeSchema.enum('account_normal_balance', [
  'DEBIT',
  'CREDIT',
  'debit',
  'credit',
]);

export const journalStatusEnum = financeSchema.enum('journal_status', [
  'DRAFT',
  'POSTED',
  'REVERSED',
  'draft',
  'posted',
  'void',
]);

export const journalSourceModuleEnum = financeSchema.enum('journal_source_module', [
  'MANUAL',
  'SALES',
  'PROCUREMENT',
  'MANUFACTURING',
  'HR_PAYROLL',
]);

export const accounts = financeSchema.table('accounts', {
  ...tenantAuditColumns(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  normalBalance: accountNormalBalanceEnum('normal_balance').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  parentId: uuid('parent_id'),
});

export const fiscalPeriods = financeSchema.table('fiscal_periods', {
  ...tenantAuditColumns(),
  name: varchar('name', { length: 100 }).notNull(), // e.g., '2026-10'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isClosed: boolean('is_closed').default(false).notNull(),
  closedByUserId: uuid('closed_by_user_id'),
  closedAt: timestamp('closed_at'),
});

export const taxRates = financeSchema.table('tax_rates', {
  ...tenantAuditColumns(),
  code: varchar('code', { length: 50 }).notNull(), // e.g., 'VAT-18', 'SSCL-2.5'
  name: varchar('name', { length: 120 }).notNull(),
  ratePercent: percentColumn('rate_percent').default('0.00').notNull(),
  taxAccountId: uuid('tax_account_id').references(() => accounts.id, { onDelete: 'restrict' }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const journalEntries = financeSchema.table('journal_entries', {
  ...tenantAuditColumns(),
  entryNumber: varchar('entry_number', { length: 50 }).notNull(),
  date: timestamp('date').notNull(),
  description: text('description'),
  reference: varchar('reference', { length: 255 }),
  sourceModule: journalSourceModuleEnum('source_module').default('MANUAL').notNull(),
  sourceDocumentId: uuid('source_document_id'), // Logical UUID reference to invoice/GRN/WO/payroll
  status: journalStatusEnum('status').default('POSTED').notNull(),
  reversedEntryId: uuid('reversed_entry_id'),
  postedByUserId: uuid('posted_by_user_id'),
});

export const journalLines = financeSchema.table('journal_lines', {
  ...tenantAuditColumns(),
  journalEntryId: uuid('journal_entry_id')
    .notNull()
    .references(() => journalEntries.id, { onDelete: 'restrict' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict' }),
  debit: moneyColumn('debit').default('0.00').notNull(),
  credit: moneyColumn('credit').default('0.00').notNull(),
  description: text('description'),
});

export const accountsReceivable = financeSchema.table('accounts_receivable', {
  ...tenantAuditColumns(),
  customerId: uuid('customer_id').notNull(), // Logical UUID reference to sales_crm.customers
  invoiceId: uuid('invoice_id').notNull(),   // Logical UUID reference to sales_crm.invoices
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, { onDelete: 'restrict' }),
  dueDate: timestamp('due_date'),
  originalAmount: moneyColumn('original_amount').notNull(),
  paidAmount: moneyColumn('paid_amount').default('0.00').notNull(),
  balanceAmount: moneyColumn('balance_amount').notNull(),
  status: varchar('status', { length: 30 }).default('OPEN').notNull(), // OPEN | PARTIALLY_PAID | PAID | OVERDUE
});

export const accountsPayable = financeSchema.table('accounts_payable', {
  ...tenantAuditColumns(),
  supplierId: uuid('supplier_id').notNull(), // Logical UUID reference to scm.suppliers
  grnId: uuid('grn_id'),                     // Logical UUID reference to scm.goods_received_notes
  supplierBillId: uuid('supplier_bill_id'),  // Logical UUID reference to scm.supplier_bills
  referenceNumber: varchar('reference_number', { length: 50 }).notNull(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, { onDelete: 'restrict' }),
  dueDate: timestamp('due_date'),
  originalAmount: moneyColumn('original_amount').notNull(),
  paidAmount: moneyColumn('paid_amount').default('0.00').notNull(),
  balanceAmount: moneyColumn('balance_amount').notNull(),
  status: varchar('status', { length: 30 }).default('OPEN').notNull(), // OPEN | PARTIALLY_PAID | PAID
});

export const financeOutboxEvents = createOutboxEventsTable(financeSchema);
export const financeProcessedEvents = createProcessedEventsTable(financeSchema);

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
  }),
  children: many(accounts),
  journalLines: many(journalLines),
}));

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalLines.accountId],
    references: [accounts.id],
  }),
}));

