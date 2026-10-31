import {
  ApproveGrnRequestInput,
  ApproveGrnRequestSchema,
  CompleteWorkOrderRequestInput,
  CompleteWorkOrderRequestSchema,
  CreateBomRequestInput,
  CreateBomRequestSchema,
  CreateDraftInvoiceRequestInput,
  CreateDraftInvoiceRequestSchema,
  CreatePurchaseOrderRequestInput,
  CreatePurchaseOrderRequestSchema,
  CreateSlaTicketRequestInput,
  CreateSlaTicketRequestSchema,
  ExecutePayrollRunRequestInput,
  ExecutePayrollRunRequestSchema,
  ExecutiveKpiResponse,
  FinalizeInvoiceRequestInput,
  FinalizeInvoiceRequestSchema,
  PostJournalEntryRequestInput,
  PostJournalEntryRequestSchema,
  ProfitAndLossResponse,
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

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Allow local dev fallback when Supabase session is not active
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
  iam: {
    getMe: () => gatewayRequest<{ user: any; tenantContext: any }>('/api/v1/iam/me', { method: 'GET' }),
  },

  finance: {
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
  },

  sales: {
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

  procurement: {
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
