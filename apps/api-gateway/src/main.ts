import { randomUUID } from 'node:crypto';
import * as http from 'node:http';
import Decimal from 'decimal.js';
import {
  ERP_RPC_PATTERNS,
  ValidateTenantAccessResponse,
} from '@zynveo/contracts';
import { verifyDoubleEntryBalance } from '@zynveo/core-accounting';
import { calculateSlaDeadline } from '@zynveo/core-crm';
import { calculateInvoiceTotals } from '@zynveo/core-invoicing';
import {
  RedisRpcClient,
  StructuredLogger,
  bootstrapMicroservice,
  createRedisRpcClient,
  ErpRpcException,
  ExecutionContext,
  RpcClientProxy,
} from '@zynveo/microservice-chassis';
import { ApiGatewayModule } from './app.module';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
  PermissionsGuard,
  RolesGuard,
} from './auth/jwt-auth.guard';
import { ErpGatewayController } from './controllers/erp-gateway.controller';

function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new ErpRpcException('BAD_REQUEST', 'Invalid JSON request body', 400));
      }
    });
    req.on('error', reject);
  });
}

function createExecutionContext(
  req: AuthenticatedRequest,
  res: http.ServerResponse,
  handler: Function,
  controllerClass: Function,
): ExecutionContext {
  return {
    getType: () => 'http' as any,
    switchToHttp: () => ({
      getRequest: () => req as any,
      getResponse: () => res as any,
    }),
    switchToRpc: () => ({
      getData: () => req.body as any,
      getContext: () => req.tenantContext as any,
    }),
    getClass: () => controllerClass as any,
    getHandler: () => handler,
  };
}

/**
 * Built-in local RPC dispatcher used when Redis microservice workers are not overrides.
 * Strictly uses `@zynveo/contracts` and `@zynveo/core-*` Decimal calculators.
 */
export function createDefaultGatewayRpcBus(): {
  iamClient: RpcClientProxy;
  rpcBus: RpcClientProxy;
} {
  const draftInvoices = new Map<
    string,
    {
      invoiceNumber: string;
      subtotalAmount: string;
      taxAmount: string;
      totalAmount: string;
    }
  >();

  const DEMO_USER_ROLES: Record<string, ValidateTenantAccessResponse['roles']> = {
    '11111111-1111-4111-8111-111111111111': ['OWNER'],
    '11111111-1111-4111-8111-222222222222': ['ACCOUNTANT'],
    '11111111-1111-4111-8111-333333333333': ['WAREHOUSE_MANAGER'],
    '11111111-1111-4111-8111-444444444444': ['SALES_REP'],
    '11111111-1111-4111-8111-555555555555': ['PROCUREMENT_OFFICER'],
    '11111111-1111-4111-8111-666666666666': ['PRODUCTION_MANAGER'],
    '11111111-1111-4111-8111-777777777777': ['HR_MANAGER'],
    '11111111-1111-4111-8111-888888888888': ['ADMIN'],
    '11111111-1111-4111-8111-999999999999': ['VIEWER'],
  };

  const iamClient: RpcClientProxy = {
    async send<TResponse = any>(pattern: { cmd: string }, payload: any): Promise<TResponse> {
      if (pattern.cmd === ERP_RPC_PATTERNS.IAM.VALIDATE_TENANT_ACCESS.cmd) {
        const assignedRoles = DEMO_USER_ROLES[payload.userId];
        const resp: ValidateTenantAccessResponse = assignedRoles
          ? {
              authorized: true,
              tenantId: payload.tenantId || '22222222-2222-4222-8222-222222222222',
              branchId: '33333333-3333-4333-8333-333333333333',
              roles: assignedRoles,
            }
          : {
              authorized: false,
              tenantId: payload.tenantId || '22222222-2222-4222-8222-222222222222',
              roles: [],
            };
        return resp as unknown as TResponse;
      }
      return { ok: true } as unknown as TResponse;
    },
  };

  const rpcBus: RpcClientProxy = {
    async send<TResponse = any>(pattern: { cmd: string }, payload: any): Promise<TResponse> {
      switch (pattern.cmd) {
        case ERP_RPC_PATTERNS.FINANCE.POST_JOURNAL_ENTRY.cmd: {
          const check = verifyDoubleEntryBalance(payload.lines || []);
          if (!check.balanced) {
            throw new ErpRpcException(
              'UNBALANCED_JOURNAL',
              `Double-entry invariant violated: Debits (${check.totalDebit}) != Credits (${check.totalCredit})`,
              400,
            );
          }
          return {
            journalEntryId: randomUUID(),
            entryNumber: `JE-${Date.now().toString().slice(-6)}`,
            status: 'POSTED',
            totalDebit: check.totalDebit,
            totalCredit: check.totalCredit,
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.SALES_CRM.CREATE_DRAFT_INVOICE.cmd: {
          const mappedLines = (payload.lines || []).map((l: any) => ({
            productId: l.productId,
            description: l.description || l.sku || 'Item',
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountPercent: '0.00',
            taxPercent: l.taxRatePercent || '0.00',
          }));
          const calc = calculateInvoiceTotals(mappedLines);
          const invoiceId = randomUUID();
          const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
          draftInvoices.set(invoiceId, {
            invoiceNumber,
            subtotalAmount: calc.subtotal,
            taxAmount: calc.taxTotal,
            totalAmount: calc.grossTotal,
          });
          return {
            invoiceId,
            invoiceNumber,
            status: 'DRAFT',
            subtotalAmount: calc.subtotal,
            discountAmount: calc.discountTotal,
            taxAmount: calc.taxTotal,
            totalAmount: calc.grossTotal,
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.SALES_CRM.FINALIZE_INVOICE.cmd: {
          const existing = draftInvoices.get(payload.invoiceId) || {
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            subtotalAmount: '1000.00',
            taxAmount: '180.00',
            totalAmount: '1180.00',
          };
          const cogs = new Decimal(existing.subtotalAmount).mul('0.60').toFixed(2);
          return {
            invoiceId: payload.invoiceId,
            invoiceNumber: existing.invoiceNumber,
            status: 'FINALIZED',
            grossReceivableAmount: existing.totalAmount,
            totalCogsAmount: cogs,
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.SALES_CRM.CREATE_SLA_TICKET.cmd: {
          const deadline = calculateSlaDeadline(payload.severity, new Date());
          return {
            ticketId: randomUUID(),
            severity: payload.severity,
            status: 'OPEN',
            slaDeadline: deadline.toISOString(),
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.PROCUREMENT.CREATE_PURCHASE_ORDER.cmd: {
          let total = new Decimal(0);
          for (const line of payload.lines || []) {
            total = total.plus(new Decimal(line.orderedQty).mul(new Decimal(line.unitCost)));
          }
          return {
            purchaseOrderId: randomUUID(),
            poNumber: `PO-${Date.now().toString().slice(-6)}`,
            status: 'ISSUED',
            totalAmount: total.toFixed(2),
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.PROCUREMENT.APPROVE_GRN.cmd: {
          let totalAcceptedQty = new Decimal(0);
          for (const line of payload.lines || []) {
            const accepted = new Decimal(line.receivedQty).minus(
              new Decimal(line.rejectedQty || '0'),
            );
            totalAcceptedQty = totalAcceptedQty.plus(accepted);
          }
          const totalAcceptedCost = totalAcceptedQty.mul(new Decimal('125.00')).toFixed(2);
          return {
            grnId: randomUUID(),
            grnNumber: `GRN-${Date.now().toString().slice(-6)}`,
            status: 'APPROVED',
            purchaseOrderStatus: 'RECEIVED',
            totalAcceptedCost,
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.MANUFACTURING.CREATE_BOM.cmd: {
          return {
            bomId: randomUUID(),
            bomCode: payload.bomCode,
            version: payload.version || '1.0',
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.MANUFACTURING.COMPLETE_WORK_ORDER.cmd: {
          const produced = new Decimal(payload.producedQty || '1');
          const totalCost = produced.mul('150.00').toFixed(2);
          return {
            workOrderId: payload.workOrderId,
            workOrderNumber: `WO-${Date.now().toString().slice(-6)}`,
            status: 'COMPLETED',
            totalProductionCost: totalCost,
            unitFinishedGoodCost: '150.00',
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.HR_PAYROLL.EXECUTE_PAYROLL_RUN.cmd: {
          return {
            payrollRunId: randomUUID(),
            runNumber: `PR-${payload.periodMonth}`,
            status: 'DISBURSED',
            totalGrossSalary: '450000.00',
            totalNetPayable: '389500.00',
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.BI_REPORTING.GET_EXECUTIVE_KPIS.cmd: {
          return {
            todayRevenue: '125400.00',
            todayInvoicesCount: 14,
            todayGrnsCount: 4,
            totalInventoryValuationWac: '64800.00',
            totalAccountsReceivable: '18450.00',
            totalAccountsPayable: '9300.00',
            lowStockProductsCount: 2,
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.BI_REPORTING.GET_PROFIT_AND_LOSS.cmd: {
          return {
            startDate: payload.startDate,
            endDate: payload.endDate,
            totalRevenue: '125400.00',
            totalCogs: '48200.00',
            grossProfit: '77200.00',
            totalOperatingExpenses: '26000.00',
            netProfit: '51200.00',
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.IAM.GET_TENANT_SETTINGS.cmd:
        case ERP_RPC_PATTERNS.IAM.UPDATE_TENANT_SETTINGS.cmd: {
          return {
            tenantId: payload.tenantId,
            name: payload.companyName || 'Zynveo Enterprise Holdings',
            slug: 'zynveo-enterprise',
            baseCurrency: payload.baseCurrency || 'USD',
            isActive: true,
            branchCount: 2,
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.IAM.LIST_USERS.cmd:
        case ERP_RPC_PATTERNS.IAM.LIST_BRANCHES.cmd:
        case ERP_RPC_PATTERNS.FINANCE.LIST_ACCOUNTS.cmd:
        case ERP_RPC_PATTERNS.FINANCE.LIST_JOURNALS.cmd:
        case ERP_RPC_PATTERNS.FINANCE.LIST_AR_INVOICES.cmd:
        case ERP_RPC_PATTERNS.FINANCE.LIST_AP_BILLS.cmd:
        case ERP_RPC_PATTERNS.SALES_CRM.LIST_INVOICES.cmd:
        case ERP_RPC_PATTERNS.SALES_CRM.LIST_QUOTATIONS.cmd:
        case ERP_RPC_PATTERNS.SALES_CRM.LIST_CUSTOMERS.cmd:
        case ERP_RPC_PATTERNS.SALES_CRM.LIST_SLA_TICKETS.cmd:
        case ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_PRODUCTS.cmd:
        case ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_WAREHOUSES.cmd:
        case ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_STOCK_LEVELS.cmd:
        case ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_STOCK_MOVEMENTS.cmd:
        case ERP_RPC_PATTERNS.PROCUREMENT.LIST_SUPPLIERS.cmd:
        case ERP_RPC_PATTERNS.PROCUREMENT.LIST_PURCHASE_ORDERS.cmd:
        case ERP_RPC_PATTERNS.PROCUREMENT.LIST_GRNS.cmd:
        case ERP_RPC_PATTERNS.MANUFACTURING.LIST_BOMS.cmd:
        case ERP_RPC_PATTERNS.MANUFACTURING.LIST_WORK_ORDERS.cmd:
        case ERP_RPC_PATTERNS.HR_PAYROLL.LIST_EMPLOYEES.cmd:
        case ERP_RPC_PATTERNS.HR_PAYROLL.LIST_PAYROLL_RUNS.cmd:
        case ERP_RPC_PATTERNS.HR_PAYROLL.LIST_DEPARTMENTS.cmd: {
          return [] as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.FINANCE.GET_TRIAL_BALANCE.cmd: {
          return {
            isBalanced: true,
            totalDebit: '0.00',
            totalCredit: '0.00',
            rows: [],
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.FINANCE.GET_BALANCE_SHEET.cmd: {
          return {
            asOfDate: new Date().toISOString(),
            assets: [],
            liabilities: [],
            equity: [],
            totalAssets: '0.00',
            totalLiabilities: '0.00',
            totalEquity: '0.00',
            retainedEarningsCurrentPeriod: '0.00',
            isBalanced: true,
          } as unknown as TResponse;
        }

        default:
          throw new ErpRpcException('NOT_FOUND', `Unsupported RPC pattern: ${pattern.cmd}`, 404);
      }
    },
  };

  return { iamClient, rpcBus };
}

export async function startApiGateway(
  port = Number(process.env.API_GATEWAY_PORT || 4000),
  overrides?: { iamClient?: RpcClientProxy; rpcBus?: RpcClientProxy },
) {
  const logger = new StructuredLogger('api-gateway');
  const isDemoMockMode = process.env.DEMO_MOCK_MODE === 'true';

  let ownedRedisClient: RedisRpcClient | null = null;
  let iamClient: RpcClientProxy;
  let rpcBus: RpcClientProxy;

  if (overrides?.iamClient && overrides?.rpcBus) {
    iamClient = overrides.iamClient;
    rpcBus = overrides.rpcBus;
  } else if (isDemoMockMode) {
    logger.warn('DEMO_MOCK_MODE=true enabled: using in-memory gateway mock RPC bus');
    const mockBus = createDefaultGatewayRpcBus();
    iamClient = overrides?.iamClient || mockBus.iamClient;
    rpcBus = overrides?.rpcBus || mockBus.rpcBus;
  } else {
    ownedRedisClient = createRedisRpcClient(process.env.REDIS_URL || 'redis://localhost:6379');
    try {
      await ownedRedisClient.connect();
    } catch (err) {
      await ownedRedisClient.close();
      throw err;
    }
    iamClient = overrides?.iamClient || ownedRedisClient;
    rpcBus = overrides?.rpcBus || ownedRedisClient;
  }

  const jwtGuard = new JwtAuthGuard(iamClient);
  const rolesGuard = new RolesGuard();
  const permissionsGuard = new PermissionsGuard();
  const controller = new ErpGatewayController(rpcBus);

  const sendJson = (res: http.ServerResponse, statusCode: number, data: unknown) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const runGuards = async (req: AuthenticatedRequest, res: http.ServerResponse, handler: Function) => {
    const ctx = createExecutionContext(req, res, handler, ErpGatewayController);
    await jwtGuard.canActivate(ctx);
    rolesGuard.canActivate(ctx);
    permissionsGuard.canActivate(ctx);
  };

  return bootstrapMicroservice({
    serviceName: 'api-gateway',
    schemaName: 'gateway',
    healthPort: port,
    appModule: ApiGatewayModule,
    enableTransport: false,
    onClose: async () => {
      if (ownedRedisClient) {
        await ownedRedisClient.close();
      }
    },
    httpHandler: async (rawReq, res) => {
      const parsedUrl = new URL(rawReq.url || '/', `http://${rawReq.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      const method = (rawReq.method || 'GET').toUpperCase();

      const req: AuthenticatedRequest = {
        headers: rawReq.headers as Record<string, string | string[] | undefined>,
      };

      const dispatch = async (
        statusCode: number,
        handler: Function,
        invoke: () => Promise<unknown>,
        withBody = false,
      ) => {
        if (withBody) {
          req.body = await readJsonBody(rawReq);
        }
        await runGuards(req, res, handler);
        sendJson(res, statusCode, await invoke());
        return true;
      };

      const staticRoutes: Array<{
        method: string;
        path: string;
        status: number;
        withBody?: boolean;
        handler: Function;
        run: () => Promise<unknown>;
      }> = [
        { method: 'GET', path: '/api/v1/iam/me', status: 200, handler: controller.getMe, run: () => controller.getMe(req) },
        { method: 'GET', path: '/api/v1/iam/users', status: 200, handler: controller.listUsers, run: () => controller.listUsers(req) },
        { method: 'POST', path: '/api/v1/iam/users/invite', status: 201, withBody: true, handler: controller.inviteUser, run: () => controller.inviteUser(req, req.body) },
        { method: 'GET', path: '/api/v1/iam/settings', status: 200, handler: controller.getTenantSettings, run: () => controller.getTenantSettings(req) },
        { method: 'PATCH', path: '/api/v1/iam/settings', status: 200, withBody: true, handler: controller.updateTenantSettings, run: () => controller.updateTenantSettings(req, req.body) },
        { method: 'GET', path: '/api/v1/iam/branches', status: 200, handler: controller.listBranches, run: () => controller.listBranches(req) },

        { method: 'GET', path: '/api/v1/finance/accounts', status: 200, handler: controller.listAccounts, run: () => controller.listAccounts(req) },
        { method: 'POST', path: '/api/v1/finance/accounts', status: 201, withBody: true, handler: controller.createAccount, run: () => controller.createAccount(req, req.body) },
        { method: 'GET', path: '/api/v1/finance/journals', status: 200, handler: controller.listJournals, run: () => controller.listJournals(req) },
        { method: 'POST', path: '/api/v1/finance/journals', status: 201, withBody: true, handler: controller.postJournalEntry, run: () => controller.postJournalEntry(req, req.body) },
        { method: 'POST', path: '/api/v1/finance/payments', status: 201, withBody: true, handler: controller.recordPayment, run: () => controller.recordPayment(req, req.body) },
        { method: 'GET', path: '/api/v1/finance/reports/trial-balance', status: 200, handler: controller.getTrialBalance, run: () => controller.getTrialBalance(req, parsedUrl.searchParams.get('asOfDate') || undefined) },
        { method: 'GET', path: '/api/v1/finance/reports/balance-sheet', status: 200, handler: controller.getBalanceSheet, run: () => controller.getBalanceSheet(req, parsedUrl.searchParams.get('asOfDate') || undefined) },
        { method: 'GET', path: '/api/v1/finance/ar', status: 200, handler: controller.listArInvoices, run: () => controller.listArInvoices(req) },
        { method: 'GET', path: '/api/v1/finance/ap', status: 200, handler: controller.listApBills, run: () => controller.listApBills(req) },

        { method: 'GET', path: '/api/v1/sales/invoices', status: 200, handler: controller.listInvoices, run: () => controller.listInvoices(req) },
        { method: 'POST', path: '/api/v1/sales/invoices', status: 201, withBody: true, handler: controller.createDraftInvoice, run: () => controller.createDraftInvoice(req, req.body) },
        { method: 'GET', path: '/api/v1/sales/quotations', status: 200, handler: controller.listQuotations, run: () => controller.listQuotations(req) },
        { method: 'GET', path: '/api/v1/sales/customers', status: 200, handler: controller.listCustomers, run: () => controller.listCustomers(req) },
        { method: 'POST', path: '/api/v1/sales/customers', status: 201, withBody: true, handler: controller.createCustomer, run: () => controller.createCustomer(req, req.body) },
        { method: 'GET', path: '/api/v1/crm/tickets', status: 200, handler: controller.listSlaTickets, run: () => controller.listSlaTickets(req) },
        { method: 'POST', path: '/api/v1/crm/tickets', status: 201, withBody: true, handler: controller.createSlaTicket, run: () => controller.createSlaTicket(req, req.body) },

        { method: 'GET', path: '/api/v1/inventory/products', status: 200, handler: controller.listProducts, run: () => controller.listProducts(req) },
        { method: 'POST', path: '/api/v1/inventory/products', status: 201, withBody: true, handler: controller.createProduct, run: () => controller.createProduct(req, req.body) },
        { method: 'GET', path: '/api/v1/inventory/warehouses', status: 200, handler: controller.listWarehouses, run: () => controller.listWarehouses(req) },
        { method: 'GET', path: '/api/v1/inventory/stock-levels', status: 200, handler: controller.listStockLevels, run: () => controller.listStockLevels(req) },
        { method: 'GET', path: '/api/v1/inventory/stock-movements', status: 200, handler: controller.listStockMovements, run: () => controller.listStockMovements(req) },
        { method: 'POST', path: '/api/v1/inventory/stock-adjustments', status: 200, withBody: true, handler: controller.adjustStock, run: () => controller.adjustStock(req, req.body) },

        { method: 'GET', path: '/api/v1/procurement/suppliers', status: 200, handler: controller.listSuppliers, run: () => controller.listSuppliers(req) },
        { method: 'POST', path: '/api/v1/procurement/suppliers', status: 201, withBody: true, handler: controller.createSupplier, run: () => controller.createSupplier(req, req.body) },
        { method: 'GET', path: '/api/v1/procurement/purchase-orders', status: 200, handler: controller.listPurchaseOrders, run: () => controller.listPurchaseOrders(req) },
        { method: 'POST', path: '/api/v1/procurement/purchase-orders', status: 201, withBody: true, handler: controller.createPurchaseOrder, run: () => controller.createPurchaseOrder(req, req.body) },
        { method: 'GET', path: '/api/v1/procurement/grns', status: 200, handler: controller.listGrns, run: () => controller.listGrns(req) },
        { method: 'POST', path: '/api/v1/procurement/grn/approve', status: 200, withBody: true, handler: controller.approveGrn, run: () => controller.approveGrn(req, req.body) },

        { method: 'GET', path: '/api/v1/manufacturing/boms', status: 200, handler: controller.listBoms, run: () => controller.listBoms(req) },
        { method: 'POST', path: '/api/v1/manufacturing/boms', status: 201, withBody: true, handler: controller.createBom, run: () => controller.createBom(req, req.body) },
        { method: 'GET', path: '/api/v1/manufacturing/work-orders', status: 200, handler: controller.listWorkOrders, run: () => controller.listWorkOrders(req) },
        { method: 'POST', path: '/api/v1/manufacturing/work-orders/release', status: 201, withBody: true, handler: controller.releaseWorkOrder, run: () => controller.releaseWorkOrder(req, req.body) },
        { method: 'POST', path: '/api/v1/manufacturing/work-orders/complete', status: 200, withBody: true, handler: controller.completeWorkOrder, run: () => controller.completeWorkOrder(req, req.body) },

        { method: 'GET', path: '/api/v1/hr/employees', status: 200, handler: controller.listEmployees, run: () => controller.listEmployees(req) },
        { method: 'POST', path: '/api/v1/hr/employees', status: 201, withBody: true, handler: controller.createEmployee, run: () => controller.createEmployee(req, req.body) },
        { method: 'GET', path: '/api/v1/hr/payroll/runs', status: 200, handler: controller.listPayrollRuns, run: () => controller.listPayrollRuns(req) },
        { method: 'POST', path: '/api/v1/hr/payroll/execute', status: 200, withBody: true, handler: controller.executePayrollRun, run: () => controller.executePayrollRun(req, req.body) },
        { method: 'GET', path: '/api/v1/hr/departments', status: 200, handler: controller.listDepartments, run: () => controller.listDepartments(req) },

        { method: 'GET', path: '/api/v1/bi/kpis', status: 200, handler: controller.getExecutiveKpis, run: () => controller.getExecutiveKpis(req) },
        {
          method: 'GET',
          path: '/api/v1/bi/profit-and-loss',
          status: 200,
          handler: controller.getProfitAndLoss,
          run: () => {
            const startDate = parsedUrl.searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const endDate = parsedUrl.searchParams.get('endDate') || new Date().toISOString();
            return controller.getProfitAndLoss(req, startDate, endDate);
          },
        },
      ];

      const matchedStatic = staticRoutes.find((r) => r.method === method && r.path === pathname);
      if (matchedStatic) {
        return dispatch(matchedStatic.status, matchedStatic.handler, matchedStatic.run, matchedStatic.withBody);
      }

      const finalizeMatch = pathname.match(/^\/api\/v1\/sales\/invoices\/([^/]+)\/finalize$/);
      if (method === 'POST' && finalizeMatch) {
        return dispatch(200, controller.finalizeInvoice, () =>
          controller.finalizeInvoice(req, decodeURIComponent(finalizeMatch[1]), req.body), true);
      }

      const journalDetailMatch = pathname.match(/^\/api\/v1\/finance\/journals\/([^/]+)$/);
      if (method === 'GET' && journalDetailMatch) {
        return dispatch(200, controller.getJournalDetail, () =>
          controller.getJournalDetail(req, decodeURIComponent(journalDetailMatch[1])));
      }

      const productMatch = pathname.match(/^\/api\/v1\/inventory\/products\/([^/]+)$/);
      if (productMatch) {
        const productId = decodeURIComponent(productMatch[1]);
        if (method === 'PATCH') {
          return dispatch(200, controller.updateProduct, () =>
            controller.updateProduct(req, productId, req.body), true);
        }
        if (method === 'DELETE') {
          return dispatch(200, controller.softDeleteProduct, () =>
            controller.softDeleteProduct(req, productId));
        }
      }

      return false;
    },
  });
}

if (require.main === module) {
  startApiGateway().catch((err) => {
    console.error('Failed to start api-gateway:', err);
    process.exit(1);
  });
}
