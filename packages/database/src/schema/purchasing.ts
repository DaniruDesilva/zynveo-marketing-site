import { pgTable, uuid, timestamp, varchar, text, numeric, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenant";
import { productVariants } from "./inventory";

export const grnStatusEnum = pgEnum("grn_status", ["draft", "received", "cancelled"]);

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const grns = pgTable("grns", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  grnNumber: varchar("grn_number", { length: 50 }).notNull(),
  status: grnStatusEnum("status").default("draft").notNull(),
  date: timestamp("date").notNull(),
  total: numeric("total", { precision: 19, scale: 4 }).default("0").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const grnLines = pgTable("grn_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  grnId: uuid("grn_id")
    .notNull()
    .references(() => grns.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id")
    .references(() => productVariants.id, { onDelete: "restrict" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 19, scale: 4 }).default("1").notNull(),
  unitCost: numeric("unit_cost", { precision: 19, scale: 4 }).default("0").notNull(),
  lineTotal: numeric("line_total", { precision: 19, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [suppliers.tenantId],
    references: [tenants.id],
  }),
  grns: many(grns),
}));

export const grnsRelations = relations(grns, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [grns.tenantId],
    references: [tenants.id],
  }),
  supplier: one(suppliers, {
    fields: [grns.supplierId],
    references: [suppliers.id],
  }),
  lines: many(grnLines),
}));

export const grnLinesRelations = relations(grnLines, ({ one }) => ({
  tenant: one(tenants, {
    fields: [grnLines.tenantId],
    references: [tenants.id],
  }),
  grn: one(grns, {
    fields: [grnLines.grnId],
    references: [grns.id],
  }),
  variant: one(productVariants, {
    fields: [grnLines.variantId],
    references: [productVariants.id],
  }),
}));
