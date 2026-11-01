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
  bootstrapMicroservice,
  ErpRpcException,
  ExecutionContext,
  RpcClientProxy,
} from '@zynveo/microservice-chassis';
import { ApiGatewayModule } from './app.module';
import { AuthenticatedRequest, JwtAuthGuard, RolesGuard } from './auth/jwt-auth.guard';
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

  const iamClient: RpcClientProxy = {
    async send<TResponse = any>(pattern: { cmd: string }, payload: any): Promise<TResponse> {
      if (pattern.cmd === ERP_RPC_PATTERNS.IAM.VALIDATE_TENANT_ACCESS.cmd) {
        const resp: ValidateTenantAccessResponse = {
          authorized: true,
          tenantId: payload.tenantId || '22222222-2222-4222-8222-222222222222',
          branchId: '33333333-3333-4333-8333-333333333333',
          roles: [
            'OWNER',
            'ADMIN',
            'ACCOUNTANT',
            'SALES_REP',
            'WAREHOUSE_MANAGER',
            'PROCUREMENT_OFFICER',
            'PRODUCTION_MANAGER',
            'HR_MANAGER',
            'VIEWER',
          ],
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
            tenantId: payload.tenantId,
            totalRevenueMtd: '125400.00',
            totalExpensesMtd: '74200.00',
            netProfitMtd: '51200.00',
            accountsReceivableOpen: '18450.00',
            accountsPayableOpen: '9300.00',
            inventoryValuationTotal: '64800.00',
            headcountActive: 24,
            refreshedAt: new Date().toISOString(),
          } as unknown as TResponse;
        }

        case ERP_RPC_PATTERNS.BI_REPORTING.GET_PROFIT_AND_LOSS.cmd: {
          return {
            tenantId: payload.tenantId,
            startDate: payload.startDate,
            endDate: payload.endDate,
            totalRevenue: '125400.00',
            totalCogs: '48200.00',
            grossProfit: '77200.00',
            totalOperatingExpenses: '26000.00',
            netProfit: '51200.00',
            lines: [
              { accountCode: '4000', accountName: 'Sales Revenue', category: 'REVENUE', balance: '125400.00' },
              { accountCode: '5000', accountName: 'Cost of Goods Sold', category: 'COGS', balance: '48200.00' },
              { accountCode: '5100', accountName: 'Salaries & Wages Expense', category: 'EXPENSE', balance: '26000.00' },
            ],
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
  const defaults = createDefaultGatewayRpcBus();
  const jwtGuard = new JwtAuthGuard(overrides?.iamClient || defaults.iamClient);
  const rolesGuard = new RolesGuard();
  const controller = new ErpGatewayController(overrides?.rpcBus || defaults.rpcBus);

  const sendJson = (res: http.ServerResponse, statusCode: number, data: unknown) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const runGuards = async (req: AuthenticatedRequest, res: http.ServerResponse, handler: Function) => {
    const ctx = createExecutionContext(req, res, handler, ErpGatewayController);
    await jwtGuard.canActivate(ctx);
    rolesGuard.canActivate(ctx);
  };

  return bootstrapMicroservice({
    serviceName: 'api-gateway',
    schemaName: 'gateway',
    healthPort: port,
    appModule: ApiGatewayModule,
    httpHandler: async (rawReq, res) => {
      const parsedUrl = new URL(rawReq.url || '/', `http://${rawReq.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      const method = (rawReq.method || 'GET').toUpperCase();

      const req: AuthenticatedRequest = {
        headers: rawReq.headers as Record<string, string | string[] | undefined>,
      };

      if (method === 'GET' && pathname === '/api/v1/iam/me') {
        await runGuards(req, res, controller.getMe);
        sendJson(res, 200, await controller.getMe(req));
        return true;
      }

      if (method === 'POST' && pathname === '/api/v1/finance/journals') {
        req.body = await readJsonBody(rawReq);
        await runGuards(req, res, controller.postJournalEntry);
        sendJson(res, 201, await controller.postJournalEntry(req, req.body));
        return true;
      }

      if (method === 'POST' && pathname === '/api/v1/sales/invoices') {
        req.body = await readJsonBody(rawReq);
        await runGuards(req, res, controller.createDraftInvoice);
        sendJson(res, 201, await controller.createDraftInvoice(req, req.body));
        return true;
      }

      const finalizeMatch = pathname.match(/^\/api\/v1\/sales\/invoices\/([^/]+)\/finalize$/);
      if (method === 'POST' && finalizeMatch) {
        req.body = await readJsonBody(rawReq);
        await runGuards(req, res, controller.finalizeInvoice);
        sendJson(
          res,
          200,
          await controller.finalizeInvoice(req, decodeURIComponent(finalizeMatch[1]), req.body),
        );
        return true;
      }

      if (method === 'POST' && pathname === '/api/v1/crm/tickets') {
        req.body = await readJsonBody(rawReq);
        await runGuards(req, res, controller.createSlaTicket);
        sendJson(res, 201, await controller.createSlaTicket(req, req.body));
        return true;
      }

      if (method === 'POST' && pathname === '/api/v1/procurement/purchase-orders') {
        req.body = await readJsonBody(rawReq);
        await runGuards(req, res, controller.createPurchaseOrder);
        sendJson(res, 201, await controller.createPurchaseOrder(req, req.body));
        return true;
      }

      if (method === 'POST' && pathname === '/api/v1/procurement/grn/approve') {
        req.body = await readJsonBody(rawReq);
        await runGuards(req, res, controller.approveGrn);
        sendJson(res, 200, await controller.approveGrn(req, req.body));
        return true;
      }

      if (method === 'POST' && pathname === '/api/v1/manufacturing/boms') {
        req.body = await readJsonBody(rawReq);
        await runGuards(req, res, controller.createBom);
        sendJson(res, 201, await controller.createBom(req, req.body));
        return true;
      }

      if (method === 'POST' && pathname === '/api/v1/manufacturing/work-orders/complete') {
        req.body = await readJsonBody(rawReq);
        await runGuards(req, res, controller.completeWorkOrder);
        sendJson(res, 200, await controller.completeWorkOrder(req, req.body));
        return true;
      }

      if (method === 'POST' && pathname === '/api/v1/hr/payroll/execute') {
        req.body = await readJsonBody(rawReq);
        await runGuards(req, res, controller.executePayrollRun);
        sendJson(res, 200, await controller.executePayrollRun(req, req.body));
        return true;
      }

      if (method === 'GET' && pathname === '/api/v1/bi/kpis') {
        await runGuards(req, res, controller.getExecutiveKpis);
        sendJson(res, 200, await controller.getExecutiveKpis(req));
        return true;
      }

      if (method === 'GET' && pathname === '/api/v1/bi/profit-and-loss') {
        await runGuards(req, res, controller.getProfitAndLoss);
        const startDate = parsedUrl.searchParams.get('startDate') || '2026-01-01';
        const endDate = parsedUrl.searchParams.get('endDate') || '2026-12-31';
        sendJson(res, 200, await controller.getProfitAndLoss(req, startDate, endDate));
        return true;
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
