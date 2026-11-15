import {
  AdjustStockRequestInput,
  AdjustStockRequestSchema,
  ApproveGrnRequestInput,
  ApproveGrnRequestSchema,
  BalanceSheetResponse,
  CompleteWorkOrderRequestInput,
  CompleteWorkOrderRequestSchema,
  CreateAccountRequestInput,
  CreateAccountRequestSchema,
  CreateBomRequestInput,
  CreateBomRequestSchema,
  CreateCustomerRequestInput,
  CreateCustomerRequestSchema,
  CreateDraftInvoiceRequestInput,
  CreateDraftInvoiceRequestSchema,
  CreateEmployeeRequestInput,
  CreateEmployeeRequestSchema,
  CreateProductRequestInput,
  CreateProductRequestSchema,
  CreatePurchaseOrderRequestInput,
  CreatePurchaseOrderRequestSchema,
  CreateSlaTicketRequestInput,
  CreateSlaTicketRequestSchema,
  CreateSupplierRequestInput,
  CreateSupplierRequestSchema,
  ExecutePayrollRunRequestInput,
  ExecutePayrollRunRequestSchema,
  ExecutiveKpiResponse,
  FinalizeInvoiceRequestInput,
  FinalizeInvoiceRequestSchema,
  InviteUserRequestInput,
  InviteUserRequestSchema,
  PostJournalEntryRequestInput,
  PostJournalEntryRequestSchema,
  ProfitAndLossResponse,
  RecordPaymentRequestInput,
  RecordPaymentRequestSchema,
  ReleaseWorkOrderRequestInput,
  ReleaseWorkOrderRequestSchema,
  TenantSettingsResponse,
  TrialBalanceResponse,
  UpdateProductRequestInput,
  UpdateProductRequestSchema,
  UpdateTenantSettingsRequestInput,
  UpdateTenantSettingsRequestSchema,
} from '@zynveo/contracts';
import { supabase } from './supabaseClient';

const API_GATEWAY_BASE_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';

async function getGatewayHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-correlation-id':
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}`,
  };

  if (typeof window !== 'undefined') {
    try {
      const localToken = window.localStorage.getItem('zynveo_access_token');
      if (localToken && localToken.split('.').length === 3) {
        headers.Authorization = `Bearer ${localToken}`;
        return headers;
      }
    } catch {
      // Ignore storage access errors
    }
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Allow unauthenticated requests to receive explicit 401 from gateway
  }

  return headers;
}

async function gatewayRequest<TResponse>(
  path: string,
  init: RequestInit,
): Promise<TResponse> {
  const headers = await getGatewayHeaders();
  const res = await fetch(`${API_GATEWAY_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    let errorBody: any = null;
    try {
      errorBody = await res.json();
    } catch {
      // Ignore non-JSON error body
    }
    throw new Error(
      errorBody?.message || `Gateway request failed (${res.status}): ${path}`,
    );
  }

  return (await res.json()) as TResponse;
}

/**
 * Strongly-typed API Gateway Client (`apps/api-gateway`, HTTP Port 4000).
 * Enforces GEMINI.md Rule 5: All state-changing ERP mutations (`POST`, `PATCH`)
 * are validated with `@zynveo/contracts` Zod schemas and routed through `apps/api-gateway`.
 * `TenantContext` (`tenantId`, `branchId`, `actorUserId`) is injected strictly by the gateway from the verified JWT.
 */
export const erpApi = {
  checkHealth: async () => {
    const res = await fetch(`${API_GATEWAY_BASE_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Gateway health check failed (${res.status})`);
    }
    return res.json() as Promise<{ status: string; service?: string; timestamp?: string }>;
  },

  iam: {
    getMe: () => gatewayRequest<{ user: any; tenantContext: any }>('/api/v1/iam/me', { method: 'GET' }),
    listUsers: () => gatewayRequest<any[]>('/api/v1/iam/users', { method: 'GET' }),
    inviteUser: (input: InviteUserRequestInput) => {
      const payload = InviteUserRequestSchema.parse(input);
      return gatewayRequest<any>('/api/v1/iam/users/invite', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getSettings: () =>
      gatewayRequest<TenantSettingsResponse>('/api/v1/iam/settings', { method: 'GET' }),
    updateSettings: (input: UpdateTenantSettingsRequestInput) => {
      const payload = UpdateTenantSettingsRequestSchema.parse(input);
      return gatewayRequest<TenantSettingsResponse>('/api/v1/iam/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    listBranches: () => gatewayRequest<any[]>('/api/v1/iam/branches', { method: 'GET' }),
  },

  finance: {
    listAccounts: () => gatewayRequest<any[]>('/api/v1/finance/accounts', { method: 'GET' }),
    createAccount: (input: CreateAccountRequestInput) => {
      const payload = CreateAccountRequestSchema.parse(input);
      return gatewayRequest<any>('/api/v1/finance/accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    listJournals: () => gatewayRequest<any[]>('/api/v1/finance/journals', { method: 'GET' }),
    getJournalDetail: (journalEntryId: string) =>
      gatewayRequest<any>(`/api/v1/finance/journals/${encodeURIComponent(journalEntryId)}`, {
        method: 'GET',
      }),
    postJournalEntry: (input: PostJournalEntryRequestInput) => {
      const payload = PostJournalEntryRequestSchema.parse(input);
      return gatewayRequest<{
        journalEntryId: string;
        entryNumber: string;
        status: string;
        totalDebit: string;
        totalCredit: string;
      }>('/api/v1/finance/journals', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    recordPayment: (input: RecordPaymentRequestInput) => {
      const payload = RecordPaymentRequestSchema.parse(input);
      return gatewayRequest<{
        journalEntryId: string;
        entryNumber: string;
        paymentType: string;
        amount: string;
        status: string;
      }>('/api/v1/finance/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getTrialBalance: (asOfDate?: string) =>
      gatewayRequest<TrialBalanceResponse>(
        asOfDate
          ? `/api/v1/finance/reports/trial-balance?asOfDate=${encodeURIComponent(asOfDate)}`
          : '/api/v1/finance/reports/trial-balance',
        { method: 'GET' },
      ),
    getBalanceSheet: (asOfDate?: string) =>
      gatewayRequest<BalanceSheetResponse>(
        asOfDate
          ? `/api/v1/finance/reports/balance-sheet?asOfDate=${encodeURIComponent(asOfDate)}`
          : '/api/v1/finance/reports/balance-sheet',
        { method: 'GET' },
      ),
    listArInvoices: () => gatewayRequest<any[]>('/api/v1/finance/ar', { method: 'GET' }),
    listApBills: () => gatewayRequest<any[]>('/api/v1/finance/ap', { method: 'GET' }),
  },

  sales: {
    listInvoices: () => gatewayRequest<any[]>('/api/v1/sales/invoices', { method: 'GET' }),
    createDraftInvoice: (input: CreateDraftInvoiceRequestInput) => {
      const payload = CreateDraftInvoiceRequestSchema.parse(input);
      return gatewayRequest<{
        invoiceId: string;
        invoiceNumber: string;
        status: string;
        subtotalAmount: string;
        discountAmount: string;
        taxAmount: string;
        totalAmount: string;
      }>('/api/v1/sales/invoices', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    /**
     * Triggers the Order-to-Cash Saga (`POST /api/v1/sales/invoices/:invoiceId/finalize`).
     * Never sends client-supplied prices or quantities; `svc-crm-sales` loads authoritative lines from its DB.
     */
    finalizeInvoice: (invoiceId: string, input: FinalizeInvoiceRequestInput) => {
      const payload = FinalizeInvoiceRequestSchema.parse(input);
      return gatewayRequest<{
        invoiceId: string;
        invoiceNumber: string;
        status: 'FINALIZED';
        grossReceivableAmount: string;
        totalCogsAmount: string;
      }>(`/api/v1/sales/invoices/${encodeURIComponent(invoiceId)}/finalize`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    listQuotations: () => gatewayRequest<any[]>('/api/v1/sales/quotations', { method: 'GET' }),
    listCustomers: () => gatewayRequest<any[]>('/api/v1/sales/customers', { method: 'GET' }),
    createCustomer: (input: CreateCustomerRequestInput) => {
      const payload = CreateCustomerRequestSchema.parse(input);
      return gatewayRequest<any>('/api/v1/sales/customers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    listSlaTickets: () => gatewayRequest<any[]>('/api/v1/crm/tickets', { method: 'GET' }),
    createSlaTicket: (input: CreateSlaTicketRequestInput) => {
      const payload = CreateSlaTicketRequestSchema.parse(input);
      return gatewayRequest<{
        ticketId: string;
        severity: string;
        status: string;
        slaDeadline: string;
      }>('/api/v1/crm/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  inventory: {
    listProducts: () => gatewayRequest<any[]>('/api/v1/inventory/products', { method: 'GET' }),
    createProduct: (input: CreateProductRequestInput) => {
      const payload = CreateProductRequestSchema.parse(input);
      return gatewayRequest<any>('/api/v1/inventory/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    updateProduct: (productId: string, input: Omit<UpdateProductRequestInput, 'productId'>) => {
      const payload = UpdateProductRequestSchema.parse({ ...input, productId });
      return gatewayRequest<any>(`/api/v1/inventory/products/${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    softDeleteProduct: (productId: string) =>
      gatewayRequest<any>(`/api/v1/inventory/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      }),
    listWarehouses: () => gatewayRequest<any[]>('/api/v1/inventory/warehouses', { method: 'GET' }),
    listStockLevels: () =>
      gatewayRequest<any[]>('/api/v1/inventory/stock-levels', { method: 'GET' }),
    listStockMovements: () =>
      gatewayRequest<any[]>('/api/v1/inventory/stock-movements', { method: 'GET' }),
    adjustStock: (input: AdjustStockRequestInput) => {
      const payload = AdjustStockRequestSchema.parse(input);
      return gatewayRequest<any>('/api/v1/inventory/stock-adjustments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  procurement: {
    listSuppliers: () => gatewayRequest<any[]>('/api/v1/procurement/suppliers', { method: 'GET' }),
    createSupplier: (input: CreateSupplierRequestInput) => {
      const payload = CreateSupplierRequestSchema.parse(input);
      return gatewayRequest<any>('/api/v1/procurement/suppliers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    listPurchaseOrders: () =>
      gatewayRequest<any[]>('/api/v1/procurement/purchase-orders', { method: 'GET' }),
    createPurchaseOrder: (input: CreatePurchaseOrderRequestInput) => {
      const payload = CreatePurchaseOrderRequestSchema.parse(input);
      return gatewayRequest<{
        purchaseOrderId: string;
        poNumber: string;
        status: string;
        totalAmount: string;
      }>('/api/v1/procurement/purchase-orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    listGrns: () => gatewayRequest<any[]>('/api/v1/procurement/grns', { method: 'GET' }),
    /**
     * Submits & approves a Goods Received Note (`POST /api/v1/procurement/grn/approve`).
     * Client-supplied `orderedQty` and `unitCost` are never accepted; `svc-procurement` loads authoritative PO lines.
     */
    approveGrn: (input: ApproveGrnRequestInput) => {
      const payload = ApproveGrnRequestSchema.parse(input);
      return gatewayRequest<{
        grnId: string;
        grnNumber: string;
        status: 'APPROVED';
        purchaseOrderStatus: string;
        totalAcceptedCost: string;
      }>('/api/v1/procurement/grn/approve', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  manufacturing: {
    listBoms: () => gatewayRequest<any[]>('/api/v1/manufacturing/boms', { method: 'GET' }),
    createBom: (input: CreateBomRequestInput) => {
      const payload = CreateBomRequestSchema.parse(input);
      return gatewayRequest<{
        bomId: string;
        bomCode: string;
        version: string;
      }>('/api/v1/manufacturing/boms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    listWorkOrders: () =>
      gatewayRequest<any[]>('/api/v1/manufacturing/work-orders', { method: 'GET' }),
    releaseWorkOrder: (input: ReleaseWorkOrderRequestInput) => {
      const payload = ReleaseWorkOrderRequestSchema.parse(input);
      return gatewayRequest<any>('/api/v1/manufacturing/work-orders/release', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    completeWorkOrder: (input: CompleteWorkOrderRequestInput) => {
      const payload = CompleteWorkOrderRequestSchema.parse(input);
      return gatewayRequest<{
        workOrderId: string;
        workOrderNumber: string;
        status: 'COMPLETED';
        totalProductionCost: string;
        unitFinishedGoodCost: string;
      }>('/api/v1/manufacturing/work-orders/complete', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  hr: {
    listEmployees: () => gatewayRequest<any[]>('/api/v1/hr/employees', { method: 'GET' }),
    createEmployee: (input: CreateEmployeeRequestInput) => {
      const payload = CreateEmployeeRequestSchema.parse(input);
      return gatewayRequest<any>('/api/v1/hr/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    listPayrollRuns: () => gatewayRequest<any[]>('/api/v1/hr/payroll/runs', { method: 'GET' }),
    executePayrollRun: (input: ExecutePayrollRunRequestInput) => {
      const payload = ExecutePayrollRunRequestSchema.parse(input);
      return gatewayRequest<{
        payrollRunId: string;
        runNumber: string;
        status: 'DISBURSED';
        totalGrossSalary: string;
        totalNetPayable: string;
      }>('/api/v1/hr/payroll/execute', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    listDepartments: () => gatewayRequest<any[]>('/api/v1/hr/departments', { method: 'GET' }),
  },

  bi: {
    getExecutiveKpis: () =>
      gatewayRequest<ExecutiveKpiResponse>('/api/v1/bi/kpis', { method: 'GET' }),

    getProfitAndLoss: (startDate: string, endDate: string) =>
      gatewayRequest<ProfitAndLossResponse>(
        `/api/v1/bi/profit-and-loss?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        { method: 'GET' },
      ),
  },
};

