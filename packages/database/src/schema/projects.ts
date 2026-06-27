import { pgTable, uuid, timestamp, varchar, text, integer, pgEnum, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenant";
import { customers } from "./crm";

export const projectStatusEnum = pgEnum("project_status", ["planning", "active", "on_hold", "completed", "cancelled"]);
export const rentalStatusEnum = pgEnum("rental_status", ["reserved", "rented", "returned", "overdue"]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "set null" }), // Optional link to a CRM customer
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: projectStatusEnum("status").default("planning").notNull(),
  budget: decimal("budget", { precision: 15, scale: 4 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("todo").notNull(), // todo, in_progress, done
  estimatedHours: decimal("estimated_hours", { precision: 8, scale: 2 }),
  loggedHours: decimal("logged_hours", { precision: 8, scale: 2 }).default("0"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rentalAssets = pgTable("rental_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  serialNumber: varchar("serial_number", { length: 100 }),
  dailyRate: decimal("daily_rate", { precision: 15, scale: 4 }).notNull(),
  status: varchar("status", { length: 50 }).default("available").notNull(), // available, rented, maintenance
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rentals = pgTable("rentals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => rentalAssets.id, { onDelete: "cascade" }),
  projectId: uuid("project_id") // Optional link to a project
    .references(() => projects.id, { onDelete: "set null" }),
  status: rentalStatusEnum("status").default("reserved").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalCost: decimal("total_cost", { precision: 15, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [projects.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  tasks: many(tasks),
  rentals: many(rentals),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tasks.tenantId],
    references: [tenants.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const rentalAssetsRelations = relations(rentalAssets, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [rentalAssets.tenantId],
    references: [tenants.id],
  }),
  rentals: many(rentals),
}));

export const rentalsRelations = relations(rentals, ({ one }) => ({
  tenant: one(tenants, {
    fields: [rentals.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [rentals.customerId],
    references: [customers.id],
  }),
  asset: one(rentalAssets, {
    fields: [rentals.assetId],
    references: [rentalAssets.id],
  }),
  project: one(projects, {
    fields: [rentals.projectId],
    references: [projects.id],
  }),
}));
