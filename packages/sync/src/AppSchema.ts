import { column, Schema, TableV2 as Table } from '@powersync/web';

// Local representation of the multi-tenant architecture and accounting schema.
// PowerSync will replicate the cloud data (Supabase) into these local SQLite tables.

export const AppSchema = new Schema({
  tenants: new Table({
    name: column.text,
    slug: column.text,
    is_active: column.integer, // booleans map to integers in SQLite
    created_at: column.text,
    updated_at: column.text
  }),
  
  users: new Table({
    email: column.text,
    first_name: column.text,
    last_name: column.text,
    is_active: column.integer,
    created_at: column.text,
    updated_at: column.text
  }),

  tenant_users: new Table({
    tenant_id: column.text,
    user_id: column.text,
    role: column.text,
    created_at: column.text,
    updated_at: column.text
  }),

  customers: new Table({
    tenant_id: column.text,
    name: column.text,
    email: column.text,
    phone: column.text,
    address: column.text,
    company: column.text,
    tier: column.text,
    created_at: column.text,
    updated_at: column.text
  }),
  communication_logs: new Table({
    tenant_id: column.text,
    customer_id: column.text,
    type: column.text,
    notes: column.text,
    date: column.text
  }),
  complaint_tickets: new Table({
    tenant_id: column.text,
    customer_id: column.text,
    subject: column.text,
    description: column.text,
    severity: column.text,
    status: column.text,
    sla_deadline: column.text,
    resolution_notes: column.text,
    created_at: column.text,
    updated_at: column.text
  }),
  projects: new Table({
    tenant_id: column.text,
    customer_id: column.text,
    name: column.text,
    description: column.text,
    status: column.text,
    budget: column.real,
    start_date: column.text,
    end_date: column.text,
    created_at: column.text,
    updated_at: column.text
  }),
  tasks: new Table({
    tenant_id: column.text,
    project_id: column.text,
    title: column.text,
    description: column.text,
    status: column.text,
    estimated_hours: column.real,
    logged_hours: column.real,
    due_date: column.text,
    created_at: column.text,
    updated_at: column.text
  }),
  rental_assets: new Table({
    tenant_id: column.text,
    name: column.text,
    serial_number: column.text,
    daily_rate: column.real,
    status: column.text,
    created_at: column.text,
    updated_at: column.text
  }),
  rentals: new Table({
    tenant_id: column.text,
    customer_id: column.text,
    asset_id: column.text,
    project_id: column.text,
    status: column.text,
    start_date: column.text,
    end_date: column.text,
    total_cost: column.real,
    created_at: column.text,
    updated_at: column.text
  }),

  accounts: new Table({
    tenant_id: column.text,
    code: column.text,
    name: column.text,
    type: column.text,
    normal_balance: column.text,
    description: column.text,
    is_active: column.integer,
    parent_id: column.text,
    created_at: column.text,
    updated_at: column.text
  }),

  journal_entries: new Table({
    tenant_id: column.text,
    entry_number: column.text,
    date: column.text,
    description: column.text,
    reference: column.text,
    status: column.text,
    created_at: column.text,
    updated_at: column.text
  }),

  journal_lines: new Table({
    tenant_id: column.text,
    journal_entry_id: column.text,
    account_id: column.text,
    debit: column.real, // NUMERIC maps to REAL in PowerSync/SQLite
    credit: column.real,
    description: column.text,
    created_at: column.text,
    updated_at: column.text
  }),

  // Inventory Schema
  products: new Table({
    tenant_id: column.text,
    name: column.text,
    description: column.text,
    category: column.text,
    brand: column.text,
    is_active: column.integer,
    created_at: column.text,
    updated_at: column.text
  }),

  product_variants: new Table({
    tenant_id: column.text,
    product_id: column.text,
    sku: column.text,
    barcode: column.text,
    name: column.text,
    price: column.real,
    cost: column.real,
    is_active: column.integer,
    created_at: column.text,
    updated_at: column.text
  }),

  warehouses: new Table({
    tenant_id: column.text,
    name: column.text,
    location: column.text,
    is_active: column.integer,
    created_at: column.text,
    updated_at: column.text
  }),

  stock_levels: new Table({
    tenant_id: column.text,
    variant_id: column.text,
    warehouse_id: column.text,
    quantity: column.real,
    batch_number: column.text,
    expiration_date: column.text,
    created_at: column.text,
    updated_at: column.text
  }),

  // Invoicing Schema
  documents: new Table({
    tenant_id: column.text,
    type: column.text,
    document_number: column.text,
    status: column.text,
    customer_id: column.text,
    date: column.text,
    due_date: column.text,
    subtotal: column.real,
    tax_total: column.real,
    discount_total: column.real,
    total: column.real,
    notes: column.text,
    terms: column.text,
    linked_document_id: column.text,
    journal_entry_id: column.text,
    created_at: column.text,
    updated_at: column.text
  }),

  document_lines: new Table({
    tenant_id: column.text,
    document_id: column.text,
    variant_id: column.text,
    description: column.text,
    quantity: column.real,
    unit_price: column.real,
    discount: column.real,
    tax_rate: column.real,
    line_total: column.real,
    created_at: column.text,
    updated_at: column.text
  })
});

export type Database = (typeof AppSchema)['types'];
