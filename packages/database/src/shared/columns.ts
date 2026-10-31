import { uuid, timestamp, numeric } from 'drizzle-orm/pg-core';

/**
 * Base audit columns for root tables (e.g., `iam.tenants`, `iam.users`) that do not belong to a parent tenantId.
 */
export const baseAuditColumns = () => ({
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * Mandatory operational ERP table columns per GEMINI.md Rule 2:
 * - `id`: UUID primary key
 * - `tenantId`: logical UUID reference to `iam.tenants.id` (no cross-schema FK lock)
 * - `createdAt`, `updatedAt`, `deletedAt` (Soft Delete)
 */
export const tenantAuditColumns = () => ({
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

/**
 * Currency / monetary column helper (`numeric(15, 2)`) per GEMINI.md Rule 3.
 */
export const moneyColumn = (columnName: string) =>
  numeric(columnName, { precision: 15, scale: 2 });

/**
 * Unit quantity / BOM conversion ratio column helper (`numeric(15, 4)`) per GEMINI.md Rule 3.
 */
export const quantityColumn = (columnName: string) =>
  numeric(columnName, { precision: 15, scale: 4 });

/**
 * Percentage rate column helper (`numeric(5, 2)`).
 */
export const percentColumn = (columnName: string) =>
  numeric(columnName, { precision: 5, scale: 2 });

