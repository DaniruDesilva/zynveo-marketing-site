import {
  AdjustStockRequestSchema,
  AdjustStockSchema,
  ApproveGrnRequestSchema,
  ApproveGrnSchema,
  BiDateRangeQuerySchema,
  CompleteWorkOrderRequestSchema,
  CompleteWorkOrderSchema,
  CreateAccountRequestSchema,
  CreateAccountSchema,
  CreateBomRequestSchema,
  CreateBomSchema,
  CreateCustomerRequestSchema,
  CreateCustomerSchema,
  CreateDraftInvoiceRequestSchema,
  CreateDraftInvoiceSchema,
  CreateEmployeeRequestSchema,
  CreateEmployeeSchema,
  CreateProductRequestSchema,
  CreateProductSchema,
  CreatePurchaseOrderRequestSchema,
  CreatePurchaseOrderSchema,
  CreateSlaTicketRequestSchema,
  CreateSlaTicketSchema,
  CreateSupplierRequestSchema,
  CreateSupplierSchema,
  ERP_RPC_PATTERNS,
  ExecutePayrollRunRequestSchema,
  ExecutePayrollRunSchema,
  FinalizeInvoiceRequestSchema,
  FinalizeInvoiceSchema,
  GetTrialBalanceSchema,
  InviteUserRequestSchema,
  InviteUserSchema,
  PostJournalEntryRequestSchema,
  PostJournalEntrySchema,
  RecordPaymentRequestSchema,
  RecordPaymentSchema,
  ReleaseWorkOrderRequestSchema,
  ReleaseWorkOrderSchema,
  SoftDeleteProductSchema,
  TenantContext,
  UpdateProductRequestSchema,
  UpdateProductSchema,
  UpdateTenantSettingsRequestSchema,
  UpdateTenantSettingsSchema,
} from '@zynveo/contracts';
import {
  Body,
  Controller,
  Delete,
  ErpRpcException,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  RpcClientProxy,
  UseGuards,
  ZodValidationPipe,
} from '@zynveo/microservice-chassis';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermission,
  Roles,
  RolesGuard,
} from '../auth/jwt-auth.guard';

export const GATEWAY_RPC_BUS = 'ZYNVEO_GATEWAY_RPC_BUS';

@Controller('/api/v1')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
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
  @RequirePermission('finance.journal.post')
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
  @RequirePermission('sales.invoice.create')
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
  @RequirePermission('sales.invoice.finalize')
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
  @RequirePermission('crm.ticket.create')
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
  @RequirePermission('procurement.po.create')
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
  @RequirePermission('procurement.grn.approve')
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
  @RequirePermission('manufacturing.bom.manage')
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
  @RequirePermission('manufacturing.work_order.complete')
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
  @RequirePermission('hr.payroll.execute')
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
  @RequirePermission('bi.dashboard.view')
  async getExecutiveKpis(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.BI_REPORTING.GET_EXECUTIVE_KPIS, ctx);
  }

  @Get('/bi/profit-and-loss')
  @Roles('ACCOUNTANT', 'VIEWER')
  @RequirePermission('bi.reports.view')
  async getProfitAndLoss(
    @Req() req: AuthenticatedRequest,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const ctx = this.requireContext(req);
    const dto = BiDateRangeQuerySchema.parse({ ...ctx, startDate, endDate });
    return this.rpcBus.send(ERP_RPC_PATTERNS.BI_REPORTING.GET_PROFIT_AND_LOSS, dto);
  }

  // ---- IAM & Settings ----

  @Get('/iam/users')
  @Roles('ADMIN')
  @RequirePermission('iam.users.view')
  async listUsers(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.IAM.LIST_USERS, ctx);
  }

  @Post('/iam/users/invite')
  @Roles('ADMIN')
  @RequirePermission('iam.users.manage')
  async inviteUser(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(InviteUserRequestSchema).transform(rawBody);
    const rpcDto = InviteUserSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.IAM.INVITE_USER, rpcDto);
  }

  @Get('/iam/settings')
  @Roles('ADMIN')
  @RequirePermission('settings.company.view')
  async getTenantSettings(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.IAM.GET_TENANT_SETTINGS, ctx);
  }

  @Patch('/iam/settings')
  @Roles('ADMIN')
  @RequirePermission('settings.company.manage')
  async updateTenantSettings(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(UpdateTenantSettingsRequestSchema).transform(rawBody);
    const rpcDto = UpdateTenantSettingsSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.IAM.UPDATE_TENANT_SETTINGS, rpcDto);
  }

  @Get('/iam/branches')
  @Roles('ADMIN', 'VIEWER')
  @RequirePermission('bi.dashboard.view')
  async listBranches(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.IAM.LIST_BRANCHES, ctx);
  }

  // ---- Finance & Accounting ----

  @Get('/finance/accounts')
  @Roles('ACCOUNTANT')
  @RequirePermission('finance.accounts.view')
  async listAccounts(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.LIST_ACCOUNTS, ctx);
  }

  @Post('/finance/accounts')
  @Roles('ACCOUNTANT')
  @RequirePermission('finance.accounts.manage')
  async createAccount(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CreateAccountRequestSchema).transform(rawBody);
    const rpcDto = CreateAccountSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.CREATE_ACCOUNT, rpcDto);
  }

  @Get('/finance/journals')
  @Roles('ACCOUNTANT')
  @RequirePermission('finance.journal.view')
  async listJournals(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.LIST_JOURNALS, ctx);
  }

  @Get('/finance/journals/:journalEntryId')
  @Roles('ACCOUNTANT')
  @RequirePermission('finance.journal.view')
  async getJournalDetail(
    @Req() req: AuthenticatedRequest,
    @Param('journalEntryId') journalEntryId: string,
  ) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.GET_JOURNAL_DETAIL, {
      ...ctx,
      journalEntryId,
    });
  }

  @Post('/finance/payments')
  @Roles('ACCOUNTANT')
  @RequirePermission('finance.payment.record')
  async recordPayment(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(RecordPaymentRequestSchema).transform(rawBody);
    const rpcDto = RecordPaymentSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.RECORD_PAYMENT, rpcDto);
  }

  @Get('/finance/reports/trial-balance')
  @Roles('ACCOUNTANT', 'VIEWER')
  @RequirePermission('bi.reports.view')
  async getTrialBalance(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate?: string) {
    const ctx = this.requireContext(req);
    const dto = GetTrialBalanceSchema.parse({
      ...ctx,
      asOfDate: asOfDate || undefined,
    });
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.GET_TRIAL_BALANCE, dto);
  }

  @Get('/finance/reports/balance-sheet')
  @Roles('ACCOUNTANT', 'VIEWER')
  @RequirePermission('bi.reports.view')
  async getBalanceSheet(@Req() req: AuthenticatedRequest, @Query('asOfDate') asOfDate?: string) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.GET_BALANCE_SHEET, {
      ...ctx,
      asOfDate: asOfDate || undefined,
    });
  }

  @Get('/finance/ar')
  @Roles('ACCOUNTANT')
  @RequirePermission('finance.accounts.view')
  async listArInvoices(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.LIST_AR_INVOICES, ctx);
  }

  @Get('/finance/ap')
  @Roles('ACCOUNTANT')
  @RequirePermission('finance.accounts.view')
  async listApBills(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.FINANCE.LIST_AP_BILLS, ctx);
  }

  // ---- Sales & CRM ----

  @Get('/sales/invoices')
  @Roles('SALES_REP', 'ACCOUNTANT')
  @RequirePermission('sales.invoice.view')
  async listInvoices(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.SALES_CRM.LIST_INVOICES, ctx);
  }

  @Get('/sales/quotations')
  @Roles('SALES_REP', 'ACCOUNTANT')
  @RequirePermission('sales.invoice.view')
  async listQuotations(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.SALES_CRM.LIST_QUOTATIONS, ctx);
  }

  @Get('/sales/customers')
  @Roles('SALES_REP', 'ACCOUNTANT')
  @RequirePermission('sales.invoice.view')
  async listCustomers(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.SALES_CRM.LIST_CUSTOMERS, ctx);
  }

  @Post('/sales/customers')
  @Roles('SALES_REP', 'ADMIN')
  @RequirePermission('sales.customer.manage')
  async createCustomer(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CreateCustomerRequestSchema).transform(rawBody);
    const rpcDto = CreateCustomerSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.SALES_CRM.CREATE_CUSTOMER, rpcDto);
  }

  @Get('/crm/tickets')
  @Roles('SALES_REP', 'ADMIN')
  @RequirePermission('sales.invoice.view')
  async listSlaTickets(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.SALES_CRM.LIST_SLA_TICKETS, ctx);
  }

  // ---- Inventory & WMS ----

  @Get('/inventory/products')
  @Roles('WAREHOUSE_MANAGER', 'SALES_REP', 'PROCUREMENT_OFFICER', 'PRODUCTION_MANAGER', 'VIEWER')
  @RequirePermission('inventory.stock.view')
  async listProducts(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_PRODUCTS, ctx);
  }

  @Post('/inventory/products')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @RequirePermission('inventory.product.manage')
  async createProduct(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CreateProductRequestSchema).transform(rawBody);
    const rpcDto = CreateProductSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.INVENTORY_WMS.CREATE_PRODUCT, rpcDto);
  }

  @Patch('/inventory/products/:productId')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @RequirePermission('inventory.product.manage')
  async updateProduct(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() rawBody: unknown,
  ) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(UpdateProductRequestSchema).transform({
      ...(typeof rawBody === 'object' && rawBody !== null ? rawBody : {}),
      productId,
    });
    const rpcDto = UpdateProductSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.INVENTORY_WMS.UPDATE_PRODUCT, rpcDto);
  }

  @Delete('/inventory/products/:productId')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @RequirePermission('inventory.product.manage')
  async softDeleteProduct(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    const ctx = this.requireContext(req);
    const rpcDto = SoftDeleteProductSchema.parse({ ...ctx, productId });
    return this.rpcBus.send(ERP_RPC_PATTERNS.INVENTORY_WMS.SOFT_DELETE_PRODUCT, rpcDto);
  }

  @Get('/inventory/warehouses')
  @Roles('WAREHOUSE_MANAGER', 'SALES_REP', 'PROCUREMENT_OFFICER', 'PRODUCTION_MANAGER', 'VIEWER')
  @RequirePermission('inventory.stock.view')
  async listWarehouses(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_WAREHOUSES, ctx);
  }

  @Get('/inventory/stock-levels')
  @Roles('WAREHOUSE_MANAGER', 'SALES_REP', 'PROCUREMENT_OFFICER', 'PRODUCTION_MANAGER', 'VIEWER')
  @RequirePermission('inventory.stock.view')
  async listStockLevels(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_STOCK_LEVELS, ctx);
  }

  @Get('/inventory/stock-movements')
  @Roles('WAREHOUSE_MANAGER', 'ACCOUNTANT', 'VIEWER')
  @RequirePermission('inventory.stock.view')
  async listStockMovements(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.INVENTORY_WMS.LIST_STOCK_MOVEMENTS, ctx);
  }

  @Post('/inventory/stock-adjustments')
  @Roles('WAREHOUSE_MANAGER', 'PRODUCTION_MANAGER')
  @RequirePermission('inventory.stock.adjust')
  async adjustStock(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(AdjustStockRequestSchema).transform(rawBody);
    const rpcDto = AdjustStockSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.INVENTORY_WMS.ADJUST_STOCK, rpcDto);
  }

  // ---- Procurement ----

  @Get('/procurement/suppliers')
  @Roles('PROCUREMENT_OFFICER', 'WAREHOUSE_MANAGER', 'ACCOUNTANT', 'VIEWER')
  @RequirePermission('procurement.po.view')
  async listSuppliers(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.PROCUREMENT.LIST_SUPPLIERS, ctx);
  }

  @Post('/procurement/suppliers')
  @Roles('PROCUREMENT_OFFICER', 'ADMIN')
  @RequirePermission('procurement.po.create')
  async createSupplier(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CreateSupplierRequestSchema).transform(rawBody);
    const rpcDto = CreateSupplierSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.PROCUREMENT.CREATE_SUPPLIER, rpcDto);
  }

  @Get('/procurement/purchase-orders')
  @Roles('PROCUREMENT_OFFICER', 'WAREHOUSE_MANAGER', 'ACCOUNTANT', 'VIEWER')
  @RequirePermission('procurement.po.view')
  async listPurchaseOrders(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.PROCUREMENT.LIST_PURCHASE_ORDERS, ctx);
  }

  @Get('/procurement/grns')
  @Roles('PROCUREMENT_OFFICER', 'WAREHOUSE_MANAGER', 'ACCOUNTANT', 'VIEWER')
  @RequirePermission('procurement.po.view')
  async listGrns(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.PROCUREMENT.LIST_GRNS, ctx);
  }

  // ---- Manufacturing ----

  @Get('/manufacturing/boms')
  @Roles('PRODUCTION_MANAGER', 'WAREHOUSE_MANAGER')
  @RequirePermission('manufacturing.bom.view')
  async listBoms(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.MANUFACTURING.LIST_BOMS, ctx);
  }

  @Get('/manufacturing/work-orders')
  @Roles('PRODUCTION_MANAGER', 'WAREHOUSE_MANAGER')
  @RequirePermission('manufacturing.bom.view')
  async listWorkOrders(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.MANUFACTURING.LIST_WORK_ORDERS, ctx);
  }

  @Post('/manufacturing/work-orders/release')
  @Roles('PRODUCTION_MANAGER')
  @RequirePermission('manufacturing.bom.manage')
  async releaseWorkOrder(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(ReleaseWorkOrderRequestSchema).transform(rawBody);
    const rpcDto = ReleaseWorkOrderSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.MANUFACTURING.RELEASE_WORK_ORDER, rpcDto);
  }

  // ---- HR & Payroll ----

  @Get('/hr/employees')
  @Roles('HR_MANAGER', 'ACCOUNTANT')
  @RequirePermission('hr.employee.view')
  async listEmployees(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.HR_PAYROLL.LIST_EMPLOYEES, ctx);
  }

  @Post('/hr/employees')
  @Roles('HR_MANAGER', 'ADMIN')
  @RequirePermission('hr.payroll.execute')
  async createEmployee(@Req() req: AuthenticatedRequest, @Body() rawBody: unknown) {
    const ctx = this.requireContext(req);
    const body = new ZodValidationPipe(CreateEmployeeRequestSchema).transform(rawBody);
    const rpcDto = CreateEmployeeSchema.parse({ ...body, ...ctx });
    return this.rpcBus.send(ERP_RPC_PATTERNS.HR_PAYROLL.CREATE_EMPLOYEE, rpcDto);
  }

  @Get('/hr/payroll/runs')
  @Roles('HR_MANAGER', 'ACCOUNTANT')
  @RequirePermission('hr.payroll.view')
  async listPayrollRuns(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.HR_PAYROLL.LIST_PAYROLL_RUNS, ctx);
  }

  @Get('/hr/departments')
  @Roles('HR_MANAGER', 'ADMIN')
  @RequirePermission('hr.employee.view')
  async listDepartments(@Req() req: AuthenticatedRequest) {
    const ctx = this.requireContext(req);
    return this.rpcBus.send(ERP_RPC_PATTERNS.HR_PAYROLL.LIST_DEPARTMENTS, ctx);
  }
}

