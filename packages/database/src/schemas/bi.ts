import { pgSchema } from 'drizzle-orm/pg-core';
import { createProcessedEventsTable } from '../shared/outbox';

export const biSchema = pgSchema('bi');

/**
 * `svc-bi-reporting` inbox table to ensure idempotent materialized view refresh triggers.
 */
export const biProcessedEvents = createProcessedEventsTable(biSchema);

/**
 * Materialized View names owned by `pgSchema('bi')` (defined in `migrations/0001_schemas.sql`).
 * Each view has a unique index so `REFRESH MATERIALIZED VIEW CONCURRENTLY` executes without locking readers.
 */
export const BI_MATERIALIZED_VIEWS = {
  DAILY_SALES_SUMMARY: 'bi.mv_daily_sales_summary',
  INVENTORY_VALUATION_WAC: 'bi.mv_inventory_valuation_wac',
  AR_AGING_BUCKETS: 'bi.mv_ar_aging_buckets',
  TRIAL_BALANCE: 'bi.mv_trial_balance',
} as const;

export type MvDailySalesSummaryRow = {
  tenant_id: string;
  sale_date: string;
  invoices_count: number;
  net_revenue: string;
  total_tax: string;
  gross_revenue: string;
  total_cogs: string;
};

export type MvInventoryValuationWacRow = {
  tenant_id: string;
  warehouse_id: string;
  variant_id: string;
  sku: string;
  quantity_on_hand: string;
  unit_wac_cost: string;
  total_valuation: string;
};

export type MvArAgingBucketsRow = {
  tenant_id: string;
  customer_id: string;
  bucket_current: string;
  bucket_1_30: string;
  bucket_31_60: string;
  bucket_61_90: string;
  bucket_over_90: string;
  total_receivable: string;
};

export type MvTrialBalanceRow = {
  tenant_id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: string;
  total_debit: string;
  total_credit: string;
  net_balance: string;
};

