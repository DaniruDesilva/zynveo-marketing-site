import {
  ApproveGrnRequestSchema,
  ApproveGrnSchema,
  BiDateRangeQuerySchema,
  CompleteWorkOrderRequestSchema,
  CompleteWorkOrderSchema,
  CreateBomRequestSchema,
  CreateBomSchema,
  CreateDraftInvoiceRequestSchema,
  CreateDraftInvoiceSchema,
  CreatePurchaseOrderRequestSchema,
  CreatePurchaseOrderSchema,
  CreateSlaTicketRequestSchema,
  CreateSlaTicketSchema,
  ERP_RPC_PATTERNS,
  ExecutePayrollRunRequestSchema,
  ExecutePayrollRunSchema,
  FinalizeInvoiceRequestSchema,
  FinalizeInvoiceSchema,
  PostJournalEntryRequestSchema,
  PostJournalEntrySchema,
  TenantContext,
} from '@zynveo/contracts';
import {
  Body,
  Controller,
  ErpRpcException,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  RpcClientProxy,
  UseGuards,
  ZodValidationPipe,
} from '@zynveo/microservice-chassis';
import { AuthenticatedRequest, JwtAuthGuard, Roles, RolesGuard } from '../auth/jwt-auth.guard';

export const GATEWAY_RPC_BUS = 'ZYNVEO_GATEWAY_RPC_BUS';

@Controller('/api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ErpGatewayController {
  constructor(
    @Inject(GATEWAY_RPC_BUS)
    private readonly rpcBus: RpcClientProxy,
  ) {}

  private requireContext(req: AuthenticatedRequest): TenantContext {
    if (!req.tenantContext) {
      throw new ErpRpcException('UNAUTHORIZED', 'Missing gateway TenantContext', 401);
    }
    return req.tenantContext;
  }

  @Get('/iam/me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return {
      user: req.user,
      tenantContext: ctx,
    };
  }

  @Post('/finance/journals')
  @Roles('ACCOUNTANT')
  async postJournalEntry(
    @Req() req: AuthenticatedRequest,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(PostJournalEntryRequestSchema).transform(rawBody);
    const rpcDto = PostJournalEntrySchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.POST_JOURNAL_ENTRY, rpcDto);
  }

  @Post('/sales/invoices')
  @Roles('SALES_REP', 'ACCOUNTANT')
  async createDraftInvoice(
    @Req() req: AuthenticatedRequest,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CreateDraftInvoiceRequestSchema).transform(rawBody);
    const rpcDto = CreateDraftInvoiceSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.SALES_CRM.CREATE_DRAFT_INVOICE, rpcDto);
  }

  /**
   * Finalizes a draft invoice (`POST /api/v1/sales/invoices/:invoiceId/finalize`).
   * Client-supplied line prices/quantities or tenantId are stripped by `FinalizeInvoiceRequestSchema`;
   * `svc-crm-sales` loads authoritative invoice lines from its own database.
   */
  @Post('/sales/invoices/:invoiceId/finalize')
  @Roles('SALES_REP', 'ACCOUNTANT')
  async finalizeInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('invoiceId') invoiceId: string,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(FinalizeInvoiceRequestSchema).transform(rawBody);
    const rpcDto = FinalizeInvoiceSchema.parse({
      ...ctx,
      invoiceId,
      warehouseId: body.warehouseId,
    });
    return this.rpcBus.send(ERP_RPC_PATTERNS.SALES_CRM.FINALIZE_INVOICE, rpcDto);
  }

  @Post('/crm/tickets')
  @Roles('SALES_REP')
  async createSlaTicket(
    @Req() req: AuthenticatedRequest,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CreateSlaTicketRequestSchema).transform(rawBody);
    const rpcDto = CreateSlaTicketSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.SALES_CRM.CREATE_SLA_TICKET, rpcDto);
  }

  @Post('/procurement/purchase-orders')
  @Roles('PROCUREMENT_OFFICER', 'WAREHOUSE_MANAGER')
  async createPurchaseOrder(
    @Req() req: AuthenticatedRequest,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CreatePurchaseOrderRequestSchema).transform(rawBody);
    const rpcDto = CreatePurchaseOrderSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.PROCUREMENT.CREATE_PURCHASE_ORDER, rpcDto);
  }

  @Post('/procurement/grn/approve')
  @Roles('WAREHOUSE_MANAGER', 'PROCUREMENT_OFFICER')
  async approveGrn(
    @Req() req: AuthenticatedRequest,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(ApproveGrnRequestSchema).transform(rawBody);
    const rpcDto = ApproveGrnSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.PROCUREMENT.APPROVE_GRN, rpcDto);
  }

  @Post('/manufacturing/boms')
  @Roles('PRODUCTION_MANAGER')
  async createBom(
    @Req() req: AuthenticatedRequest,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CreateBomRequestSchema).transform(rawBody);
    const rpcDto = CreateBomSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.MANUFACTURING.CREATE_BOM, rpcDto);
  }

  @Post('/manufacturing/work-orders/complete')
  @Roles('PRODUCTION_MANAGER', 'WAREHOUSE_MANAGER')
  async completeWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CompleteWorkOrderRequestSchema).transform(rawBody);
    const rpcDto = CompleteWorkOrderSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.MANUFACTURING.COMPLETE_WORK_ORDER, rpcDto);
  }

  @Post('/hr/payroll/execute')
  @Roles('HR_MANAGER', 'ACCOUNTANT')
  async executePayrollRun(
    @Req() req: AuthenticatedRequest,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(ExecutePayrollRunRequestSchema).transform(rawBody);
    const rpcDto = ExecutePayrollRunSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.HR_PAYROLL.EXECUTE_PAYROLL_RUN, rpcDto);
  }

  @Get('/bi/kpis')
  @Roles('VIEWER', 'ACCOUNTANT')
  async getExecutiveKpis(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.BI_REPORTING.GET_EXECUTIVE_KPIS, ctx);
  }

  @Get('/bi/profit-and-loss')
  @Roles('ACCOUNTANT')
  async getProfitAndLoss(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const ctx = this.requireContext(req);
    const dto = BiDateRangeQuerySchema.parse({ ...ctx, startDate, endDate });
    return this.rpcBus.send(ERP_RPC_PATTERNS.BI_REPORTING.GET_PROFIT_AND_LOSS, dto);
  }
}

