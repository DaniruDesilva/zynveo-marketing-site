/**
 * Synchronous RPC command patterns (`@MessagePattern`) dispatched over NestJS Redis transport.
 */
const INVENTORY_PATTERNS = {
  ATOMIC_STOCK_DECREMENT: { cmd: 'inventory.atomic_stock_decrement' },
  ATOMIC_STOCK_INCREMENT: { cmd: 'inventory.atomic_stock_increment' },
  RESERVE_STOCK: { cmd: 'inventory.reserve_stock' },
  RELEASE_STOCK_RESERVATION: { cmd: 'inventory.release_stock_reservation' },
  TRANSFER_WAREHOUSE_STOCK: { cmd: 'inventory.transfer_warehouse_stock' },
  GET_PRODUCT_WAC: { cmd: 'inventory.get_product_wac' },
  LIST_PRODUCTS: { cmd: 'inventory.list_products' },
  CREATE_PRODUCT: { cmd: 'inventory.create_product' },
  UPDATE_PRODUCT: { cmd: 'inventory.update_product' },
  SOFT_DELETE_PRODUCT: { cmd: 'inventory.soft_delete_product' },
  LIST_WAREHOUSES: { cmd: 'inventory.list_warehouses' },
  LIST_STOCK_LEVELS: { cmd: 'inventory.list_stock_levels' },
  LIST_STOCK_MOVEMENTS: { cmd: 'inventory.list_stock_movements' },
  ADJUST_STOCK: { cmd: 'inventory.adjust_stock' },
} as const;

export const ERP_RPC_PATTERNS = {
  IAM: {
    VALIDATE_TENANT_ACCESS: { cmd: 'iam.validate_tenant_access' },
    LOG_AUDIT_TRAIL: { cmd: 'iam.log_audit_trail' },
    GET_USER_PROFILE: { cmd: 'iam.get_user_profile' },
    LIST_USERS: { cmd: 'iam.list_users' },
    INVITE_USER: { cmd: 'iam.invite_user' },
    GET_TENANT_SETTINGS: { cmd: 'iam.get_tenant_settings' },
    UPDATE_TENANT_SETTINGS: { cmd: 'iam.update_tenant_settings' },
    LIST_BRANCHES: { cmd: 'iam.list_branches' },
  },
  FINANCE: {
    POST_JOURNAL_ENTRY: { cmd: 'finance.post_journal_entry' },
    CHECK_CUSTOMER_CREDIT: { cmd: 'finance.check_customer_credit' },
    GET_TRIAL_BALANCE: { cmd: 'finance.get_trial_balance' },
    GET_BALANCE_SHEET: { cmd: 'finance.get_balance_sheet' },
    LIST_ACCOUNTS: { cmd: 'finance.list_accounts' },
    CREATE_ACCOUNT: { cmd: 'finance.create_account' },
    LIST_JOURNALS: { cmd: 'finance.list_journals' },
    GET_JOURNAL_DETAIL: { cmd: 'finance.get_journal_detail' },
    RECORD_PAYMENT: { cmd: 'finance.record_payment' },
    LIST_AR_INVOICES: { cmd: 'finance.list_ar_invoices' },
    LIST_AP_BILLS: { cmd: 'finance.list_ap_bills' },
  },
  HR_PAYROLL: {
    EXECUTE_PAYROLL_RUN: { cmd: 'hr.execute_payroll_run' },
    GENERATE_PAYSLIP_PDF: { cmd: 'hr.generate_payslip_pdf' },
    LIST_EMPLOYEES: { cmd: 'hr.list_employees' },
    CREATE_EMPLOYEE: { cmd: 'hr.create_employee' },
    LIST_PAYROLL_RUNS: { cmd: 'hr.list_payroll_runs' },
    LIST_DEPARTMENTS: { cmd: 'hr.list_departments' },
  },
  PROCUREMENT: {
    CREATE_PURCHASE_ORDER: { cmd: 'scm.create_purchase_order' },
    APPROVE_GRN: { cmd: 'scm.approve_grn' },
    VERIFY_THREE_WAY_MATCH: { cmd: 'scm.verify_three_way_match' },
    LIST_SUPPLIERS: { cmd: 'scm.list_suppliers' },
    CREATE_SUPPLIER: { cmd: 'scm.create_supplier' },
    LIST_PURCHASE_ORDERS: { cmd: 'scm.list_purchase_orders' },
    LIST_GRNS: { cmd: 'scm.list_grns' },
  },
  INVENTORY: INVENTORY_PATTERNS,
  INVENTORY_WMS: INVENTORY_PATTERNS,
  MANUFACTURING: {
    CREATE_BOM: { cmd: 'mfg.create_bom' },
    RELEASE_WORK_ORDER: { cmd: 'mfg.release_work_order' },
    COMPLETE_WORK_ORDER: { cmd: 'mfg.complete_work_order' },
    LIST_BOMS: { cmd: 'mfg.list_boms' },
    LIST_WORK_ORDERS: { cmd: 'mfg.list_work_orders' },
  },
  SALES_CRM: {
    CREATE_DRAFT_INVOICE: { cmd: 'sales.create_draft_invoice' },
    CONVERT_QUOTE_TO_INVOICE: { cmd: 'sales.convert_quote_to_invoice' },
    FINALIZE_INVOICE: { cmd: 'sales.finalize_invoice' },
    CREATE_SLA_TICKET: { cmd: 'crm.create_sla_ticket' },
    LIST_INVOICES: { cmd: 'sales.list_invoices' },
    LIST_QUOTATIONS: { cmd: 'sales.list_quotations' },
    LIST_CUSTOMERS: { cmd: 'sales.list_customers' },
    CREATE_CUSTOMER: { cmd: 'sales.create_customer' },
    LIST_SLA_TICKETS: { cmd: 'crm.list_sla_tickets' },
  },
  BI_REPORTING: {
    GET_EXECUTIVE_KPIS: { cmd: 'bi.get_executive_kpis' },
    GET_PROFIT_AND_LOSS: { cmd: 'bi.get_profit_and_loss' },
    REFRESH_MATERIALIZED_VIEWS: { cmd: 'bi.refresh_materialized_views' },
  },
} as const;

/**
 * Asynchronous domain event names persisted in `outbox_events` and delivered via BullMQ.
 */
export const ERP_EVENT_PATTERNS = {
  INVOICE_FINALIZED: 'event.sales.invoice_finalized',
  INVOICE_STOCK_FAILED: 'event.sales.invoice_stock_failed',
  GRN_APPROVED: 'event.scm.grn_approved',
  WORK_ORDER_COMPLETED: 'event.mfg.work_order_completed',
  PAYROLL_DISBURSED: 'event.hr.payroll_disbursed',
  LOW_STOCK_THRESHOLD_BREACHED: 'event.inventory.low_stock_breached',
  STOCK_LEVEL_MUTATED: 'event.inventory.stock_level_mutated',
  JOURNAL_POSTED: 'event.finance.journal_posted',
  MEMBERSHIP_CHANGED: 'event.iam.membership_changed',
} as const;

export type ErpEventName = (typeof ERP_EVENT_PATTERNS)[keyof typeof ERP_EVENT_PATTERNS];

/**
 * Durable BullMQ queue names (one inbox queue per domain microservice).
 */
export const ERP_BULLMQ_QUEUES = {
  IAM: 'zynveo.events.iam',
  FINANCE: 'zynveo.events.finance',
  HR_PAYROLL: 'zynveo.events.hr-payroll',
  PROCUREMENT: 'zynveo.events.procurement',
  INVENTORY: 'zynveo.events.inventory',
  MANUFACTURING: 'zynveo.events.manufacturing',
  SALES_CRM: 'zynveo.events.sales-crm',
  BI_REPORTING: 'zynveo.events.bi-reporting',
} as const;

export type ErpBullMqQueueName = (typeof ERP_BULLMQ_QUEUES)[keyof typeof ERP_BULLMQ_QUEUES];

/**
 * Deterministic fan-out routing table used by `OutboxRelayWorker`.
 * Maps each domain event to the durable BullMQ service queues that subscribe to it.
 */
export const ERP_EVENT_SUBSCRIPTIONS: Record<ErpEventName, readonly ErpBullMqQueueName[]> = {
  [ERP_EVENT_PATTERNS.INVOICE_FINALIZED]: [
    ERP_BULLMQ_QUEUES.FINANCE,
    ERP_BULLMQ_QUEUES.BI_REPORTING,
  ],
  [ERP_EVENT_PATTERNS.INVOICE_STOCK_FAILED]: [
    ERP_BULLMQ_QUEUES.SALES_CRM,
  ],
  [ERP_EVENT_PATTERNS.GRN_APPROVED]: [
    ERP_BULLMQ_QUEUES.INVENTORY,
    ERP_BULLMQ_QUEUES.FINANCE,
    ERP_BULLMQ_QUEUES.BI_REPORTING,
  ],
  [ERP_EVENT_PATTERNS.WORK_ORDER_COMPLETED]: [
    ERP_BULLMQ_QUEUES.FINANCE,
    ERP_BULLMQ_QUEUES.BI_REPORTING,
  ],
  [ERP_EVENT_PATTERNS.PAYROLL_DISBURSED]: [
    ERP_BULLMQ_QUEUES.FINANCE,
    ERP_BULLMQ_QUEUES.BI_REPORTING,
  ],
  [ERP_EVENT_PATTERNS.LOW_STOCK_THRESHOLD_BREACHED]: [
    ERP_BULLMQ_QUEUES.PROCUREMENT,
    ERP_BULLMQ_QUEUES.BI_REPORTING,
  ],
  [ERP_EVENT_PATTERNS.STOCK_LEVEL_MUTATED]: [
    ERP_BULLMQ_QUEUES.BI_REPORTING,
  ],
  [ERP_EVENT_PATTERNS.JOURNAL_POSTED]: [
    ERP_BULLMQ_QUEUES.BI_REPORTING,
  ],
  [ERP_EVENT_PATTERNS.MEMBERSHIP_CHANGED]: [
    ERP_BULLMQ_QUEUES.IAM,
  ],
} as const;
