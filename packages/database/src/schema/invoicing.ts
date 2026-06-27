import { pgTable, uuid, timestamp, varchar, boolean, text, numeric, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenant";
import { productVariants } from "./inventory";
import { journalEntries } from "./accounting";

export const documentTypeEnum = pgEnum("document_type", ["quote", "invoice", "credit_note"]);
export const documentStatusEnum = pgEnum("document_status", ["draft", "sent", "paid", "void", "partially_paid"]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  documentNumber: varchar("document_number", { length: 50 }).notNull(),
  status: documentStatusEnum("status").default("draft").notNull(),
  customerId: uuid("customer_id"), // Will map to CRM customer table later
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date"),
  subtotal: numeric("subtotal", { precision: 19, scale: 4 }).default("0").notNull(),
  taxTotal: numeric("tax_total", { precision: 19, scale: 4 }).default("0").notNull(),
  discountTotal: numeric("discount_total", { precision: 19, scale: 4 }).default("0").notNull(),
  total: numeric("total", { precision: 19, scale: 4 }).default("0").notNull(),
  notes: text("notes"),
  terms: text("terms"),
  
  // Link Credit Note back to original invoice
  linkedDocumentId: uuid("linked_document_id"),
  
  // Link to accounting journal entry
  journalEntryId: uuid("journal_entry_id")
    .references(() => journalEntries.id, { onDelete: "set null" }),
    
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentLines = pgTable("document_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id")
    .references(() => productVariants.id, { onDelete: "restrict" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 19, scale: 4 }).default("1").notNull(),
  unitPrice: numeric("unit_price", { precision: 19, scale: 4 }).default("0").notNull(),
  discount: numeric("discount", { precision: 19, scale: 4 }).default("0").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default("0").notNull(),
  lineTotal: numeric("line_total", { precision: 19, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  lines: many(documentLines),
  linkedDocument: one(documents, {
    fields: [documents.linkedDocumentId],
    references: [documents.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [documents.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const documentLinesRelations = relations(documentLines, ({ one }) => ({
  tenant: one(tenants, {
    fields: [documentLines.tenantId],
    references: [tenants.id],
  }),
  document: one(documents, {
    fields: [documentLines.documentId],
    references: [documents.id],
  }),
  variant: one(productVariants, {
    fields: [documentLines.variantId],
    references: [productVariants.id],
  }),
}));
