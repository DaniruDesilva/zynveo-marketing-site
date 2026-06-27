import { pgTable, uuid, timestamp, varchar, boolean, text, integer, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenant";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: varchar("sku", { length: 100 }).notNull(),
  barcode: varchar("barcode", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(), // e.g., 'Large Red'
  price: numeric("price", { precision: 19, scale: 4 }).notNull(),
  cost: numeric("cost", { precision: 19, scale: 4 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stockLevels = pgTable("stock_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  warehouseId: uuid("warehouse_id")
    .notNull()
    .references(() => warehouses.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 19, scale: 4 }).default("0").notNull(),
  batchNumber: varchar("batch_number", { length: 100 }),
  expirationDate: timestamp("expiration_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [productVariants.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  stockLevels: many(stockLevels),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [warehouses.tenantId],
    references: [tenants.id],
  }),
  stockLevels: many(stockLevels),
}));

export const stockLevelsRelations = relations(stockLevels, ({ one }) => ({
  tenant: one(tenants, {
    fields: [stockLevels.tenantId],
    references: [tenants.id],
  }),
  variant: one(productVariants, {
    fields: [stockLevels.variantId],
    references: [productVariants.id],
  }),
  warehouse: one(warehouses, {
    fields: [stockLevels.warehouseId],
    references: [warehouses.id],
  }),
}));
