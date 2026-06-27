import { pgTable, uuid, timestamp, varchar, text, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenant";

export const ticketSeverityEnum = pgEnum("ticket_severity", ["low", "medium", "high", "critical"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  company: varchar("company", { length: 255 }),
  tier: varchar("tier", { length: 50 }).default("standard"), // standard, premium, vip
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const communicationLogs = pgTable("communication_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // email, call, meeting
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
});

export const complaintTickets = pgTable("complaint_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  severity: ticketSeverityEnum("severity").default("low").notNull(),
  status: ticketStatusEnum("status").default("open").notNull(),
  slaDeadline: timestamp("sla_deadline"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  logs: many(communicationLogs),
  tickets: many(complaintTickets),
}));

export const communicationLogsRelations = relations(communicationLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [communicationLogs.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [communicationLogs.customerId],
    references: [customers.id],
  }),
}));

export const complaintTicketsRelations = relations(complaintTickets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [complaintTickets.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [complaintTickets.customerId],
    references: [customers.id],
  }),
}));
