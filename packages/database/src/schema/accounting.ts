import { pgTable, uuid, timestamp, varchar, boolean, numeric, pgEnum, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenant";

// ENUMS
export const accountTypeEnum = pgEnum("account_type", ["asset", "liability", "equity", "revenue", "expense"]);
export const accountNormalBalanceEnum = pgEnum("account_normal_balance", ["debit", "credit"]);
export const journalStatusEnum = pgEnum("journal_status", ["draft", "posted", "void"]);

// Chart of Accounts
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(), // e.g., '1000', '2000'
  name: varchar("name", { length: 255 }).notNull(), // e.g., 'Cash in Bank', 'Accounts Receivable'
  type: accountTypeEnum("type").notNull(),
  normalBalance: accountNormalBalanceEnum("normal_balance").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  parentId: uuid("parent_id"), // Self-referencing for hierarchical accounts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Journal Entries (Headers)
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  entryNumber: varchar("entry_number", { length: 50 }).notNull(), // Auto-generated sequence e.g., 'JE-2023-001'
  date: timestamp("date").notNull(), // The effective accounting date
  description: text("description"),
  reference: varchar("reference", { length: 255 }), // e.g., Invoice Number or Bill Number
  status: journalStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Journal Entry Lines (Debits/Credits)
export const journalLines = pgTable("journal_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  journalEntryId: uuid("journal_entry_id")
    .notNull()
    .references(() => journalEntries.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  debit: numeric("debit", { precision: 19, scale: 4 }).default("0").notNull(),
  credit: numeric("credit", { precision: 19, scale: 4 }).default("0").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [accounts.tenantId],
    references: [tenants.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
  }),
  children: many(accounts),
  journalLines: many(journalLines),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [journalEntries.tenantId],
    references: [tenants.id],
  }),
  lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  tenant: one(tenants, {
    fields: [journalLines.tenantId],
    references: [tenants.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [journalLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalLines.accountId],
    references: [accounts.id],
  }),
}));
