import { pgSchema, uuid, varchar, boolean, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseAuditColumns, tenantAuditColumns } from '../shared/columns';
import { createOutboxEventsTable, createProcessedEventsTable } from '../shared/outbox';

export const iamSchema = pgSchema('iam');

export const userRoleEnum = iamSchema.enum('user_role', [
  'OWNER',
  'ADMIN',
  'ACCOUNTANT',
  'WAREHOUSE_MANAGER',
  'SALES_REP',
  'PROCUREMENT_OFFICER',
  'HR_MANAGER',
  'PRODUCTION_MANAGER',
  'VIEWER',
]);

export const tenants = iamSchema.table('tenants', {
  ...baseAuditColumns(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  baseCurrency: varchar('base_currency', { length: 3 }).default('LKR').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const branches = iamSchema.table('branches', {
  ...tenantAuditColumns(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const users = iamSchema.table('users', {
  ...baseAuditColumns(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const tenantUsers = iamSchema.table('tenant_users', {
  ...baseAuditColumns(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'restrict' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
  role: varchar('role', { length: 50 }).notNull().default('VIEWER'),
  isActive: boolean('is_active').default(true).notNull(),
});

export const auditLogs = iamSchema.table('audit_logs', {
  ...tenantAuditColumns(),
  actorUserId: uuid('actor_user_id').notNull(),
  branchId: uuid('branch_id'),
  correlationId: uuid('correlation_id'),
  action: varchar('action', { length: 120 }).notNull(),
  resourceType: varchar('resource_type', { length: 120 }).notNull(),
  resourceId: varchar('resource_id', { length: 120 }),
  metadata: jsonb('metadata'),
});

export const iamOutboxEvents = createOutboxEventsTable(iamSchema);
export const iamProcessedEvents = createProcessedEventsTable(iamSchema);

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(tenantUsers),
  branches: many(branches),
}));

export const branchesRelations = relations(branches, ({ one }) => ({
  tenant: one(tenants, {
    fields: [branches.tenantId],
    references: [tenants.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tenants: many(tenantUsers),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.userId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [tenantUsers.branchId],
    references: [branches.id],
  }),
}));

