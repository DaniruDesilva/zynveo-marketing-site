-- ═══════════════════════════════════════════════════════════════════════════
-- Zynveo Cloud OS (Enterprise ERP) — Migration 0001: Isolated Microservice Schemas
-- Compatible with both:
--   1. Fresh local Docker PostgreSQL 16 (:5433 / zynveo_erp)
--   2. Existing Supabase PostgreSQL (migrating operational tables out of `public`)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. CREATE THE 8 ISOLATED MICROSERVICE SCHEMAS ───────────────────────────
CREATE SCHEMA IF NOT EXISTS iam;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS scm;
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS manufacturing;
CREATE SCHEMA IF NOT EXISTS sales_crm;
CREATE SCHEMA IF NOT EXISTS bi;

-- ── 2. MIGRATE EXISTING OPERATIONAL TABLES FROM `public` (IF PRESENT) ───────
-- Note: Marketing tables (`contact_inquiries`, `wishlist_signups`,
-- `newsletter_subscribers`, `feedback_submissions`) remain in `public`.
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('tenants',            'iam'),
      ('users',              'iam'),
      ('tenant_users',       'iam'),
      ('accounts',           'finance'),
      ('journal_entries',    'finance'),
      ('journal_lines',      'finance'),
      ('suppliers',          'scm'),
      ('grns',               'scm'),
      ('grn_lines',          'scm'),
      ('products',           'inventory'),
      ('product_variants',   'inventory'),
      ('warehouses',         'inventory'),
      ('stock_levels',       'inventory'),
      ('customers',          'sales_crm'),
      ('communication_logs', 'sales_crm'),
      ('complaint_tickets',  'sales_crm'),
      ('documents',          'sales_crm'),
      ('document_lines',     'sales_crm'),
      ('projects',           'sales_crm'),
      ('tasks',              'sales_crm'),
      ('rental_assets',      'sales_crm'),
      ('rentals',            'sales_crm')
    ) AS t(tbl_name, target_schema)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = rec.tbl_name
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = rec.target_schema AND table_name = rec.tbl_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I SET SCHEMA %I;', rec.tbl_name, rec.target_schema);
    END IF;
  END LOOP;

  -- Rename legacy `scm.grns` -> `scm.goods_received_notes` if migrated from `public.grns`
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'scm' AND table_name = 'grns'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'scm' AND table_name = 'goods_received_notes'
  ) THEN
    ALTER TABLE scm.grns RENAME TO goods_received_notes;
  END IF;
END $$;

-- ── 3. SCHEMA 1: `iam` (`svc-iam-tenant`) ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE iam.user_role AS ENUM (
    'OWNER', 'ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER',
    'SALES_REP', 'PROCUREMENT_OFFICER', 'HR_MANAGER', 'PRODUCTION_MANAGER', 'VIEWER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS iam.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE iam.tenants
  ADD COLUMN IF NOT EXISTS base_currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS iam.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id) ON DELETE RESTRICT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS iam.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE iam.users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS iam.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES iam.tenants(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES iam.users(id) ON DELETE RESTRICT,
  branch_id UUID REFERENCES iam.branches(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE iam.tenant_users
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES iam.branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE iam.tenant_users SET role = UPPER(role) WHERE role <> UPPER(role);

CREATE TABLE IF NOT EXISTS iam.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  actor_user_id UUID NOT NULL,
  branch_id UUID,
  correlation_id UUID,
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(120) NOT NULL,
  resource_id VARCHAR(120),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── 4. SCHEMA 2: `finance` (`svc-finance`) ──────────────────────────────────
DO $$ BEGIN
  CREATE TYPE finance.account_type AS ENUM (
    'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE',
    'asset', 'liability', 'equity', 'revenue', 'expense'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE finance.account_normal_balance AS ENUM ('DEBIT', 'CREDIT', 'debit', 'credit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE finance.journal_status AS ENUM ('DRAFT', 'POSTED', 'REVERSED', 'draft', 'posted', 'void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE finance.journal_source_module AS ENUM ('MANUAL', 'SALES', 'PROCUREMENT', 'MANUFACTURING', 'HR_PAYROLL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS finance.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type finance.account_type NOT NULL,
  normal_balance finance.account_normal_balance NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE finance.accounts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS finance.fiscal_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  closed_by_user_id UUID,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(120) NOT NULL,
  rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  tax_account_id UUID REFERENCES finance.accounts(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  entry_number VARCHAR(50) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  description TEXT,
  reference VARCHAR(255),
  source_module finance.journal_source_module NOT NULL DEFAULT 'MANUAL',
  source_document_id UUID,
  status finance.journal_status NOT NULL DEFAULT 'POSTED',
  reversed_entry_id UUID,
  posted_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE finance.journal_entries
  ADD COLUMN IF NOT EXISTS source_module finance.journal_source_module NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS source_document_id UUID,
  ADD COLUMN IF NOT EXISTS reversed_entry_id UUID,
  ADD COLUMN IF NOT EXISTS posted_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS finance.journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  journal_entry_id UUID NOT NULL REFERENCES finance.journal_entries(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES finance.accounts(id) ON DELETE RESTRICT,
  debit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  credit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE finance.journal_lines
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN debit TYPE NUMERIC(15, 2) USING ROUND(debit::numeric, 2),
  ALTER COLUMN credit TYPE NUMERIC(15, 2) USING ROUND(credit::numeric, 2);

CREATE TABLE IF NOT EXISTS finance.accounts_receivable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  invoice_id UUID NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  journal_entry_id UUID REFERENCES finance.journal_entries(id) ON DELETE RESTRICT,
  due_date TIMESTAMPTZ,
  original_amount NUMERIC(15, 2) NOT NULL,
  paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  balance_amount NUMERIC(15, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance.accounts_payable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  grn_id UUID,
  supplier_bill_id UUID,
  reference_number VARCHAR(50) NOT NULL,
  journal_entry_id UUID REFERENCES finance.journal_entries(id) ON DELETE RESTRICT,
  due_date TIMESTAMPTZ,
  original_amount NUMERIC(15, 2) NOT NULL,
  paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  balance_amount NUMERIC(15, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── 5. SCHEMA 3: `hr` (`svc-hr-payroll`) ────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE hr.payroll_run_status AS ENUM ('DRAFT', 'PROCESSING', 'DISBURSED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hr.leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS hr.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  department_id UUID REFERENCES hr.departments(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  grade VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_number VARCHAR(50) NOT NULL,
  user_id UUID,
  department_id UUID REFERENCES hr.departments(id) ON DELETE RESTRICT,
  designation_id UUID REFERENCES hr.designations(id) ON DELETE RESTRICT,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  epf_number VARCHAR(50),
  nic_number VARCHAR(50),
  bank_name VARCHAR(120),
  bank_account_number VARCHAR(80),
  joined_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES hr.employees(id) ON DELETE RESTRICT,
  basic_salary NUMERIC(15, 2) NOT NULL,
  fixed_allowances NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  overtime_hourly_rate NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES hr.employees(id) ON DELETE RESTRICT,
  work_date TIMESTAMPTZ NOT NULL,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  regular_hours NUMERIC(15, 4) NOT NULL DEFAULT 8.0000,
  overtime_hours NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  status VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES hr.employees(id) ON DELETE RESTRICT,
  leave_type VARCHAR(50) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_days NUMERIC(15, 4) NOT NULL,
  reason TEXT,
  status hr.leave_status NOT NULL DEFAULT 'PENDING',
  approved_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  run_number VARCHAR(50) NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  status hr.payroll_run_status NOT NULL DEFAULT 'DRAFT',
  total_gross_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_employee_epf_8 NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_employer_epf_12 NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_employer_etf_3 NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_apit_tax NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_net_payable NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  disbursed_at TIMESTAMPTZ,
  disbursed_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hr.payslip_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  payroll_run_id UUID NOT NULL REFERENCES hr.payroll_runs(id) ON DELETE RESTRICT,
  employee_id UUID NOT NULL REFERENCES hr.employees(id) ON DELETE RESTRICT,
  basic_salary NUMERIC(15, 2) NOT NULL,
  allowances NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  overtime_pay NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  gross_salary NUMERIC(15, 2) NOT NULL,
  employee_epf_8 NUMERIC(15, 2) NOT NULL,
  employer_epf_12 NUMERIC(15, 2) NOT NULL,
  employer_etf_3 NUMERIC(15, 2) NOT NULL,
  apit_tax NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  other_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  net_salary NUMERIC(15, 2) NOT NULL,
  pdf_s3_key VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── 6. SCHEMA 4: `scm` (`svc-procurement`) ──────────────────────────────────
DO $$ BEGIN
  CREATE TYPE scm.po_status AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scm.grn_status AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'draft', 'received', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS scm.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_registration_number VARCHAR(80),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE scm.suppliers
  ADD COLUMN IF NOT EXISTS tax_registration_number VARCHAR(80),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS scm.purchase_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  pr_number VARCHAR(50) NOT NULL,
  requested_by_user_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scm.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  po_number VARCHAR(50) NOT NULL,
  supplier_id UUID NOT NULL REFERENCES scm.suppliers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL,
  status scm.po_status NOT NULL DEFAULT 'DRAFT',
  order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_delivery_date TIMESTAMPTZ,
  subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scm.po_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  purchase_order_id UUID NOT NULL REFERENCES scm.purchase_orders(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  variant_id UUID,
  sku VARCHAR(100) NOT NULL,
  description TEXT,
  ordered_qty NUMERIC(15, 4) NOT NULL,
  received_qty NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  unit_cost NUMERIC(15, 2) NOT NULL,
  line_total NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scm.goods_received_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  grn_number VARCHAR(50) NOT NULL,
  purchase_order_id UUID REFERENCES scm.purchase_orders(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES scm.suppliers(id) ON DELETE RESTRICT,
  warehouse_id UUID,
  status scm.grn_status NOT NULL DEFAULT 'DRAFT',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  approved_by_user_id UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE scm.goods_received_notes
  ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES scm.purchase_orders(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS warehouse_id UUID,
  ADD COLUMN IF NOT EXISTS approved_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN total TYPE NUMERIC(15, 2) USING ROUND(total::numeric, 2);

CREATE TABLE IF NOT EXISTS scm.grn_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  grn_id UUID NOT NULL REFERENCES scm.goods_received_notes(id) ON DELETE RESTRICT,
  po_line_id UUID REFERENCES scm.po_lines(id) ON DELETE RESTRICT,
  product_id UUID,
  variant_id UUID,
  sku VARCHAR(100),
  description TEXT NOT NULL,
  ordered_qty NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 1.0000,
  rejected_qty NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  batch_number VARCHAR(100),
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE scm.grn_lines
  ADD COLUMN IF NOT EXISTS po_line_id UUID REFERENCES scm.po_lines(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS product_id UUID,
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ordered_qty NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS rejected_qty NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN quantity TYPE NUMERIC(15, 4) USING ROUND(quantity::numeric, 4),
  ALTER COLUMN unit_cost TYPE NUMERIC(15, 2) USING ROUND(unit_cost::numeric, 2),
  ALTER COLUMN line_total TYPE NUMERIC(15, 2) USING ROUND(line_total::numeric, 2);

CREATE TABLE IF NOT EXISTS scm.supplier_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  bill_number VARCHAR(50) NOT NULL,
  supplier_id UUID NOT NULL REFERENCES scm.suppliers(id) ON DELETE RESTRICT,
  purchase_order_id UUID REFERENCES scm.purchase_orders(id) ON DELETE RESTRICT,
  grn_id UUID REFERENCES scm.goods_received_notes(id) ON DELETE RESTRICT,
  bill_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  total_amount NUMERIC(15, 2) NOT NULL,
  three_way_match_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── 7. SCHEMA 5: `inventory` (`svc-inventory-wms`) ──────────────────────────
DO $$ BEGIN
  CREATE TYPE inventory.stock_movement_reason AS ENUM (
    'GRN_RECEIPT',
    'SALES_DISPATCH',
    'PRODUCTION_RAW_CONSUME',
    'PRODUCTION_FG_YIELD',
    'WAREHOUSE_TRANSFER',
    'STOCK_ADJUSTMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS inventory.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  brand VARCHAR(100),
  image_url TEXT,
  reorder_threshold NUMERIC(15, 4) NOT NULL DEFAULT 10.0000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE inventory.products
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS reorder_threshold NUMERIC(15, 4) NOT NULL DEFAULT 10.0000,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS inventory.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES inventory.products(id) ON DELETE RESTRICT,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  wac_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE inventory.product_variants
  ADD COLUMN IF NOT EXISTS wac_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN price TYPE NUMERIC(15, 2) USING ROUND(price::numeric, 2),
  ALTER COLUMN cost TYPE NUMERIC(15, 2) USING ROUND(cost::numeric, 2);

CREATE TABLE IF NOT EXISTS inventory.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  location TEXT,
  branch_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE inventory.warehouses
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS branch_id UUID,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS inventory.bin_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
  code VARCHAR(60) NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inventory.batches_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES inventory.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES inventory.product_variants(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
  batch_number VARCHAR(100) NOT NULL,
  manufactured_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  quantity_available NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inventory.stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID REFERENCES inventory.products(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES inventory.product_variants(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
  bin_location_id UUID REFERENCES inventory.bin_locations(id) ON DELETE SET NULL,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  reserved_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  unit_wac_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  batch_number VARCHAR(100),
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE inventory.stock_levels
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES inventory.products(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS bin_location_id UUID REFERENCES inventory.bin_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN IF NOT EXISTS unit_wac_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN quantity TYPE NUMERIC(15, 4) USING ROUND(quantity::numeric, 4);

CREATE TABLE IF NOT EXISTS inventory.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES inventory.products(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES inventory.product_variants(id) ON DELETE RESTRICT,
  reason inventory.stock_movement_reason NOT NULL,
  reference_document_id UUID NOT NULL,
  batch_number VARCHAR(100),
  quantity_delta NUMERIC(15, 4) NOT NULL,
  balance_after NUMERIC(15, 4) NOT NULL,
  unit_cost_at_movement NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_valuation_delta NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  actor_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Seed opening stock_movements rows for any migrated stock_levels rows without movements
INSERT INTO inventory.stock_movements (
  tenant_id, warehouse_id, product_id, variant_id, reason,
  reference_document_id, batch_number, quantity_delta, balance_after,
  unit_cost_at_movement, total_valuation_delta, notes
)
SELECT
  sl.tenant_id,
  sl.warehouse_id,
  pv.product_id,
  sl.variant_id,
  'STOCK_ADJUSTMENT'::inventory.stock_movement_reason,
  sl.id,
  COALESCE(sl.batch_number, 'MIGRATION-OPENING'),
  sl.quantity,
  sl.quantity,
  pv.cost,
  ROUND(sl.quantity * pv.cost, 2),
  'Opening stock balance recorded during 0001_schemas migration'
FROM inventory.stock_levels sl
JOIN inventory.product_variants pv ON pv.id = sl.variant_id
WHERE sl.quantity <> 0
  AND NOT EXISTS (
    SELECT 1 FROM inventory.stock_movements sm
    WHERE sm.variant_id = sl.variant_id AND sm.warehouse_id = sl.warehouse_id
  );

CREATE TABLE IF NOT EXISTS inventory.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES inventory.product_variants(id) ON DELETE RESTRICT,
  sales_order_id UUID NOT NULL,
  reserved_quantity NUMERIC(15, 4) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inventory.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  transfer_number VARCHAR(50) NOT NULL,
  source_warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
  target_warehouse_id UUID NOT NULL REFERENCES inventory.warehouses(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES inventory.product_variants(id) ON DELETE RESTRICT,
  quantity NUMERIC(15, 4) NOT NULL,
  batch_number VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── 8. SCHEMA 6: `manufacturing` (`svc-manufacturing`) ──────────────────────
DO $$ BEGIN
  CREATE TYPE manufacturing.work_order_status AS ENUM (
    'DRAFT', 'RELEASED', 'IN_PROGRESS', 'QA_CHECK', 'COMPLETED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS manufacturing.bills_of_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  finished_product_id UUID NOT NULL,
  bom_code VARCHAR(60) NOT NULL,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  labor_cost_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  overhead_cost_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS manufacturing.bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  bom_id UUID NOT NULL REFERENCES manufacturing.bills_of_materials(id) ON DELETE RESTRICT,
  raw_material_product_id UUID NOT NULL,
  raw_material_variant_id UUID,
  quantity_required_per_unit NUMERIC(15, 4) NOT NULL,
  scrap_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS manufacturing.work_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  hourly_rate NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS manufacturing.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  work_order_number VARCHAR(50) NOT NULL,
  bom_id UUID NOT NULL REFERENCES manufacturing.bills_of_materials(id) ON DELETE RESTRICT,
  work_center_id UUID REFERENCES manufacturing.work_centers(id) ON DELETE SET NULL,
  finished_product_id UUID NOT NULL,
  source_raw_warehouse_id UUID NOT NULL,
  target_finished_warehouse_id UUID NOT NULL,
  planned_qty NUMERIC(15, 4) NOT NULL,
  actual_produced_qty NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  output_batch_number VARCHAR(100),
  raw_material_cost_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  labor_cost_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  overhead_cost_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_production_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status manufacturing.work_order_status NOT NULL DEFAULT 'DRAFT',
  scheduled_start_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS manufacturing.material_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  work_order_id UUID NOT NULL REFERENCES manufacturing.work_orders(id) ON DELETE RESTRICT,
  raw_material_product_id UUID NOT NULL,
  consumed_quantity NUMERIC(15, 4) NOT NULL,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  batch_number VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS manufacturing.quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  work_order_id UUID NOT NULL REFERENCES manufacturing.work_orders(id) ON DELETE RESTRICT,
  inspector_user_id UUID NOT NULL,
  passed_qty NUMERIC(15, 4) NOT NULL,
  rejected_qty NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  status VARCHAR(30) NOT NULL DEFAULT 'PASSED',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ── 9. SCHEMA 7: `sales_crm` (`svc-crm-sales` + Parked Projects/Rentals) ────
DO $$ BEGIN
  CREATE TYPE sales_crm.ticket_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sales_crm.ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sales_crm.invoice_status AS ENUM ('DRAFT', 'FINALIZING', 'FINALIZED', 'PAID', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sales_crm.document_type AS ENUM ('QUOTE', 'INVOICE', 'CREDIT_NOTE', 'quote', 'invoice', 'credit_note');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sales_crm.document_status AS ENUM (
    'DRAFT', 'FINALIZING', 'FINALIZED', 'SENT', 'PAID', 'VOIDED', 'PARTIALLY_PAID',
    'draft', 'sent', 'paid', 'void', 'partially_paid'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sales_crm.project_status AS ENUM (
    'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED',
    'planning', 'active', 'on_hold', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sales_crm.rental_status AS ENUM (
    'RESERVED', 'RENTED', 'RETURNED', 'OVERDUE',
    'reserved', 'rented', 'returned', 'overdue'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS sales_crm.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(100),
  status VARCHAR(40) NOT NULL DEFAULT 'NEW',
  estimated_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  assigned_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sales_crm.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  company VARCHAR(255),
  tier VARCHAR(50) DEFAULT 'STANDARD',
  credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 100000.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE sales_crm.customers
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 100000.00,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sales_crm.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES sales_crm.customers(id) ON DELETE RESTRICT,
  type VARCHAR(50) NOT NULL,
  notes TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE sales_crm.communication_logs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sales_crm.complaint_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES sales_crm.customers(id) ON DELETE RESTRICT,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  severity sales_crm.ticket_severity NOT NULL DEFAULT 'LOW',
  status sales_crm.ticket_status NOT NULL DEFAULT 'OPEN',
  sla_deadline TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE sales_crm.complaint_tickets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sales_crm.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  quote_number VARCHAR(50) NOT NULL,
  customer_id UUID NOT NULL REFERENCES sales_crm.customers(id) ON DELETE RESTRICT,
  valid_until TIMESTAMPTZ,
  subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sales_crm.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  quotation_id UUID REFERENCES sales_crm.quotations(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES sales_crm.customers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL,
  subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sales_crm.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  sales_order_id UUID REFERENCES sales_crm.sales_orders(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES sales_crm.customers(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_cogs_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status sales_crm.invoice_status NOT NULL DEFAULT 'DRAFT',
  journal_entry_id UUID,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sales_crm.invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES sales_crm.invoices(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL,
  variant_id UUID,
  sku VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 1.0000,
  unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sales_crm.credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  credit_note_number VARCHAR(50) NOT NULL,
  invoice_id UUID NOT NULL REFERENCES sales_crm.invoices(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES sales_crm.customers(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  total_credit_amount NUMERIC(15, 2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ISSUED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sales_crm.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  type sales_crm.document_type NOT NULL,
  document_number VARCHAR(50) NOT NULL,
  status sales_crm.document_status NOT NULL DEFAULT 'draft',
  customer_id UUID REFERENCES sales_crm.customers(id) ON DELETE RESTRICT,
  warehouse_id UUID,
  date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_cogs NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  terms TEXT,
  linked_document_id UUID,
  journal_entry_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE sales_crm.documents
  ADD COLUMN IF NOT EXISTS warehouse_id UUID,
  ADD COLUMN IF NOT EXISTS total_cogs NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN subtotal TYPE NUMERIC(15, 2) USING ROUND(subtotal::numeric, 2),
  ALTER COLUMN tax_total TYPE NUMERIC(15, 2) USING ROUND(tax_total::numeric, 2),
  ALTER COLUMN discount_total TYPE NUMERIC(15, 2) USING ROUND(discount_total::numeric, 2),
  ALTER COLUMN total TYPE NUMERIC(15, 2) USING ROUND(total::numeric, 2);

CREATE TABLE IF NOT EXISTS sales_crm.document_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  document_id UUID NOT NULL REFERENCES sales_crm.documents(id) ON DELETE RESTRICT,
  product_id UUID,
  variant_id UUID,
  sku VARCHAR(100),
  description TEXT NOT NULL,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 1.0000,
  unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  line_total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE sales_crm.document_lines
  ADD COLUMN IF NOT EXISTS product_id UUID,
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN quantity TYPE NUMERIC(15, 4) USING ROUND(quantity::numeric, 4),
  ALTER COLUMN unit_price TYPE NUMERIC(15, 2) USING ROUND(unit_price::numeric, 2),
  ALTER COLUMN discount TYPE NUMERIC(15, 2) USING ROUND(discount::numeric, 2),
  ALTER COLUMN tax_rate TYPE NUMERIC(5, 2) USING ROUND(tax_rate::numeric, 2),
  ALTER COLUMN line_total TYPE NUMERIC(15, 2) USING ROUND(line_total::numeric, 2);

-- Parked Projects & Rentals tables inside `sales_crm`
CREATE TABLE IF NOT EXISTS sales_crm.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID REFERENCES sales_crm.customers(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status sales_crm.project_status NOT NULL DEFAULT 'PLANNING',
  budget NUMERIC(15, 2) DEFAULT 0.00,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE sales_crm.projects
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN budget TYPE NUMERIC(15, 2) USING ROUND(budget::numeric, 2);

CREATE TABLE IF NOT EXISTS sales_crm.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES sales_crm.projects(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'TODO',
  estimated_hours NUMERIC(15, 4),
  logged_hours NUMERIC(15, 4) DEFAULT 0.0000,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE sales_crm.tasks
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS sales_crm.rental_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(100),
  daily_rate NUMERIC(15, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE sales_crm.rental_assets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN daily_rate TYPE NUMERIC(15, 2) USING ROUND(daily_rate::numeric, 2);

CREATE TABLE IF NOT EXISTS sales_crm.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES sales_crm.customers(id) ON DELETE RESTRICT,
  asset_id UUID NOT NULL REFERENCES sales_crm.rental_assets(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES sales_crm.projects(id) ON DELETE SET NULL,
  status sales_crm.rental_status NOT NULL DEFAULT 'RESERVED',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_cost NUMERIC(15, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE sales_crm.rentals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ALTER COLUMN total_cost TYPE NUMERIC(15, 2) USING ROUND(total_cost::numeric, 2);

-- ── 10. CREATE `outbox_events` & `processed_events` ACROSS SCHEMAS ──────────
DO $$
DECLARE
  s TEXT;
BEGIN
  FOREACH s IN ARRAY ARRAY['iam', 'finance', 'hr', 'scm', 'inventory', 'manufacturing', 'sales_crm']
  LOOP
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.outbox_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        actor_user_id UUID,
        correlation_id UUID,
        event_name VARCHAR(120) NOT NULL,
        source_service VARCHAR(80) NOT NULL,
        aggregate_type VARCHAR(80),
        aggregate_id UUID,
        payload JSONB NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT ''PENDING'',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_%I_outbox_pending
        ON %I.outbox_events (created_at ASC)
        WHERE status = ''PENDING'';
    ', s, s, s);
  END LOOP;

  FOREACH s IN ARRAY ARRAY['iam', 'finance', 'hr', 'scm', 'inventory', 'manufacturing', 'sales_crm', 'bi']
  LOOP
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.processed_events (
        event_id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        event_name VARCHAR(120) NOT NULL,
        consumer_service VARCHAR(80) NOT NULL,
        correlation_id UUID,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    ', s);
  END LOOP;
END $$;

-- ── 11. SCHEMA 8: `bi` READ-ONLY MATERIALIZED VIEWS (CONCURRENT REFRESH) ────
CREATE MATERIALIZED VIEW IF NOT EXISTS bi.mv_daily_sales_summary AS
SELECT
  i.tenant_id,
  DATE_TRUNC('day', i.invoice_date)::date AS sale_date,
  COUNT(i.id)::int AS invoices_count,
  COALESCE(SUM(i.subtotal_amount - i.discount_amount), 0.00)::numeric(15,2) AS net_revenue,
  COALESCE(SUM(i.tax_amount), 0.00)::numeric(15,2) AS total_tax,
  COALESCE(SUM(i.total_amount), 0.00)::numeric(15,2) AS gross_revenue,
  COALESCE(SUM(i.total_cogs_amount), 0.00)::numeric(15,2) AS total_cogs
FROM sales_crm.invoices i
WHERE i.status IN ('FINALIZED', 'PAID') AND i.deleted_at IS NULL
GROUP BY i.tenant_id, DATE_TRUNC('day', i.invoice_date)::date;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_mv_daily_sales_summary
  ON bi.mv_daily_sales_summary (tenant_id, sale_date);

CREATE MATERIALIZED VIEW IF NOT EXISTS bi.mv_inventory_valuation_wac AS
SELECT
  sl.tenant_id,
  sl.warehouse_id,
  sl.variant_id,
  pv.sku,
  SUM(sl.quantity)::numeric(15,4) AS quantity_on_hand,
  MAX(COALESCE(NULLIF(sl.unit_wac_cost, 0), pv.wac_cost, pv.cost, 0.00))::numeric(15,2) AS unit_wac_cost,
  ROUND(SUM(sl.quantity * COALESCE(NULLIF(sl.unit_wac_cost, 0), pv.wac_cost, pv.cost, 0.00)), 2)::numeric(15,2) AS total_valuation
FROM inventory.stock_levels sl
JOIN inventory.product_variants pv ON pv.id = sl.variant_id
WHERE sl.deleted_at IS NULL AND pv.deleted_at IS NULL
GROUP BY sl.tenant_id, sl.warehouse_id, sl.variant_id, pv.sku;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_mv_inventory_valuation_wac
  ON bi.mv_inventory_valuation_wac (tenant_id, warehouse_id, variant_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS bi.mv_ar_aging_buckets AS
SELECT
  ar.tenant_id,
  ar.customer_id,
  COALESCE(SUM(CASE WHEN ar.due_date IS NULL OR ar.due_date >= now() THEN ar.balance_amount ELSE 0 END), 0.00)::numeric(15,2) AS bucket_current,
  COALESCE(SUM(CASE WHEN ar.due_date < now() AND ar.due_date >= now() - INTERVAL '30 days' THEN ar.balance_amount ELSE 0 END), 0.00)::numeric(15,2) AS bucket_1_30,
  COALESCE(SUM(CASE WHEN ar.due_date < now() - INTERVAL '30 days' AND ar.due_date >= now() - INTERVAL '60 days' THEN ar.balance_amount ELSE 0 END), 0.00)::numeric(15,2) AS bucket_31_60,
  COALESCE(SUM(CASE WHEN ar.due_date < now() - INTERVAL '60 days' AND ar.due_date >= now() - INTERVAL '90 days' THEN ar.balance_amount ELSE 0 END), 0.00)::numeric(15,2) AS bucket_61_90,
  COALESCE(SUM(CASE WHEN ar.due_date < now() - INTERVAL '90 days' THEN ar.balance_amount ELSE 0 END), 0.00)::numeric(15,2) AS bucket_over_90,
  COALESCE(SUM(ar.balance_amount), 0.00)::numeric(15,2) AS total_receivable
FROM finance.accounts_receivable ar
WHERE ar.status <> 'PAID' AND ar.deleted_at IS NULL
GROUP BY ar.tenant_id, ar.customer_id;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_mv_ar_aging_buckets
  ON bi.mv_ar_aging_buckets (tenant_id, customer_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS bi.mv_trial_balance AS
SELECT
  a.tenant_id,
  a.id AS account_id,
  a.code AS account_code,
  a.name AS account_name,
  UPPER(a.type::text) AS account_type,
  UPPER(a.normal_balance::text) AS normal_balance,
  COALESCE(SUM(jl.debit), 0.00)::numeric(15,2) AS total_debit,
  COALESCE(SUM(jl.credit), 0.00)::numeric(15,2) AS total_credit,
  CASE
    WHEN UPPER(a.normal_balance::text) = 'DEBIT'
      THEN (COALESCE(SUM(jl.debit), 0.00) - COALESCE(SUM(jl.credit), 0.00))::numeric(15,2)
    ELSE (COALESCE(SUM(jl.credit), 0.00) - COALESCE(SUM(jl.debit), 0.00))::numeric(15,2)
  END AS net_balance
FROM finance.accounts a
LEFT JOIN finance.journal_lines jl
  ON jl.account_id = a.id AND jl.deleted_at IS NULL
LEFT JOIN finance.journal_entries je
  ON je.id = jl.journal_entry_id AND UPPER(je.status::text) = 'POSTED' AND je.deleted_at IS NULL
WHERE a.deleted_at IS NULL
GROUP BY a.tenant_id, a.id, a.code, a.name, a.type, a.normal_balance;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_mv_trial_balance
  ON bi.mv_trial_balance (tenant_id, account_id);

COMMIT;

