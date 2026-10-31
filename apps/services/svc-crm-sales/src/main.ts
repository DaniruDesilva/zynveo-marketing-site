import Decimal from 'decimal.js';
import { and, eq } from 'drizzle-orm';
import {
  AtomicStockMutationResponse,
  CheckCustomerCreditResponse,
  ConvertQuoteToInvoiceDto,
  ConvertQuoteToInvoiceSchema,
  CreateDraftInvoiceDto,
  CreateDraftInvoiceSchema,
  CreateSlaTicketDto,
  CreateSlaTicketSchema,
  ERP_EVENT_PATTERNS,
  ERP_RPC_PATTERNS,
  FinalizeInvoiceDto,
  FinalizeInvoiceSchema,
  InvoiceFinalizedEventSchema,
} from '@zynveo/contracts';
import { calculateSlaDeadline } from '@zynveo/core-crm';
import * as salesCrmSchema from '@zynveo/database/sales_crm';
import {
  Controller,
  DRIZZLE_DB,
  DrizzleModule,
  ErpRpcException,
  InboxService,
  Inject,
  MessagePattern,
  Module,
  OutboxService,
  Payload,
  RpcClientProxy,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

export const SALES_RPC_CLIENT = 'ZYNVEO_SALES_RPC_CLIENT';

@Controller()
export class CrmSalesController {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: any,
    private readonly outboxService: OutboxService,
    private readonly inboxService: InboxService,
    @Inject(SALES_RPC_CLIENT)
    private readonly rpcClient?: RpcClientProxy,
  ) {}

  /**
   * Synchronous RPC (`sales_crm.create_draft_invoice`):
   * Calculates exact line and header totals using `Decimal` (ROUND_HALF_UP) and persists
   * `sales_crm.invoices` + `sales_crm.invoice_lines` in a single ACID transaction.
   */
  @MessagePattern(ERP_RPC_PATTERNS.SALES_CRM.CREATE_DRAFT_INVOICE)
  async createDraftInvoice(@Payload() rawPayload: CreateDraftInvoiceDto) {
    const dto = CreateDraftInvoiceSchema.parse(rawPayload);

    let subtotalAmount = new Decimal(0);
    let discountAmount = new Decimal(0);
    let taxAmount = new Decimal(0);

    const computedLines = dto.lines.map((line) => {
      const qty = new Decimal(line.quantity);
      const unitPrice = new Decimal(line.unitPrice);
      const lineDisc = new Decimal(line.discountAmount || '0.00');
      const taxRatePct = new Decimal(line.taxRatePercent || '0.00');

      const grossLine = qty.mul(unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const netLine = grossLine.minus(lineDisc).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      if (netLine.isNegative()) {
        throw new ErpRpcException(
          'INVALID_DISCOUNT',
          `Line discount (${lineDisc.toFixed(2)}) exceeds line gross (${grossLine.toFixed(2)}) for SKU ${line.sku}`,
          400,
        );
      }

      const lineTax = netLine
        .mul(taxRatePct)
        .div(100)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      const lineTotal = netLine.plus(lineTax).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      subtotalAmount = subtotalAmount.plus(netLine);
      discountAmount = discountAmount.plus(lineDisc);
      taxAmount = taxAmount.plus(lineTax);

      return {
        productId: line.productId,
        sku: line.sku,
        description: line.description || line.sku,
        quantity: qty.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4),
        unitPrice: unitPrice.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
        discountAmount: lineDisc.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
        taxRatePercent: taxRatePct.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
        taxAmount: lineTax.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
      };
    });

    const totalAmount = subtotalAmount.plus(taxAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    return this.db.transaction(async (tx: any) => {
      const [invoice] = await tx
        .insert(salesCrmSchema.invoices)
        .values({
          tenantId: dto.tenantId,
          invoiceNumber,
          customerId: dto.customerId,
          warehouseId: dto.warehouseId,
          currency: dto.currency,
          invoiceDate: new Date(),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          subtotalAmount: subtotalAmount.toFixed(2),
          discountAmount: discountAmount.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          totalCogsAmount: '0.00',
          status: 'DRAFT',
          notes: dto.notes ?? null,
          terms: dto.terms ?? null,
        })
        .returning();

      await tx.insert(salesCrmSchema.invoiceLines).values(
        computedLines.map((l) => ({
          tenantId: dto.tenantId,
          invoiceId: invoice.id,
          productId: l.productId,
          sku: l.sku,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountAmount: l.discountAmount,
          taxRatePercent: l.taxRatePercent,
          taxAmount: l.taxAmount,
          lineTotal: l.lineTotal,
        })),
      );

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        subtotalAmount: invoice.subtotalAmount,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
      };
    });
  }

  /**
   * Order-to-Cash Saga Orchestrator (`sales_crm.finalize_invoice`):
   * 1. Loads authoritative draft invoice + lines from `sales_crm.invoices` / `sales_crm.invoice_lines`
   *    (never trusts client-supplied prices or quantities).
   * 2. Verifies customer credit limit synchronously via `svc-finance` (`finance.check_customer_credit`).
   * 3. Atomically decrements stock & obtains WAC-based COGS via `svc-inventory-wms` (`inventory.atomic_stock_decrement`).
   * 4. Marks the invoice `FINALIZED` and writes `INVOICE_FINALIZED` to `sales_crm.outbox_events` in the same ACID transaction.
   */
  @MessagePattern(ERP_RPC_PATTERNS.SALES_CRM.FINALIZE_INVOICE)
  async finalizeInvoice(@Payload() rawPayload: FinalizeInvoiceDto) {
    const dto = FinalizeInvoiceSchema.parse(rawPayload);

    const invoiceRows = await this.db
      .select()
      .from(salesCrmSchema.invoices)
      .where(
        and(
          eq(salesCrmSchema.invoices.tenantId, dto.tenantId),
          eq(salesCrmSchema.invoices.id, dto.invoiceId),
        ),
      );

    const invoice = invoiceRows[0];
    if (!invoice) {
      throw new ErpRpcException('INVOICE_NOT_FOUND', `Invoice ${dto.invoiceId} not found`, 404);
    }

    if (invoice.status !== 'DRAFT') {
      throw new ErpRpcException(
        'INVALID_INVOICE_STATUS',
        `Invoice ${invoice.invoiceNumber} cannot be finalized from status ${invoice.status}`,
        409,
      );
    }

    const lines = await this.db
      .select()
      .from(salesCrmSchema.invoiceLines)
      .where(
        and(
          eq(salesCrmSchema.invoiceLines.tenantId, dto.tenantId),
          eq(salesCrmSchema.invoiceLines.invoiceId, dto.invoiceId),
        ),
      );

    if (!lines || lines.length === 0) {
      throw new ErpRpcException(
        'EMPTY_INVOICE',
        `Invoice ${invoice.invoiceNumber} has no line items to finalize`,
        400,
      );
    }

    // Step 2: Check customer credit headroom via svc-finance
    if (this.rpcClient) {
      const creditCheck = await this.rpcClient.send<CheckCustomerCreditResponse>(
        ERP_RPC_PATTERNS.FINANCE.CHECK_CUSTOMER_CREDIT,
        {
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          actorUserId: dto.actorUserId,
          correlationId: dto.correlationId,
          customerId: invoice.customerId,
          additionalOrderAmount: String(invoice.totalAmount),
        },
      );

      if (!creditCheck.approved) {
        throw new ErpRpcException(
          'CREDIT_LIMIT_EXCEEDED',
          creditCheck.reason || 'Customer credit limit exceeded',
          422,
        );
      }
    }

    // Step 3: Atomically decrement warehouse stock & compute WAC COGS via svc-inventory-wms
    let totalCogsValuation = '0.00';
    if (this.rpcClient) {
      const stockRes = await this.rpcClient.send<AtomicStockMutationResponse>(
        ERP_RPC_PATTERNS.INVENTORY_WMS.ATOMIC_STOCK_DECREMENT,
        {
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          actorUserId: dto.actorUserId,
          correlationId: dto.correlationId,
          warehouseId: dto.warehouseId,
          referenceDocumentId: invoice.id,
          reason: 'SALES_DISPATCH',
          items: lines.map((line: any) => ({
            productId: line.productId,
            sku: line.sku,
            quantity: String(line.quantity),
          })),
        },
      );

      totalCogsValuation = stockRes.totalCogsValuation;
    }

    // Step 4: Transactionally update invoice status to FINALIZED + enqueue INVOICE_FINALIZED in outbox_events
    return this.db.transaction(async (tx: any) => {
      await tx
        .update(salesCrmSchema.invoices)
        .set({
          warehouseId: dto.warehouseId,
          status: 'FINALIZED',
          totalCogsAmount: totalCogsValuation,
          updatedAt: new Date(),
        })
        .where(eq(salesCrmSchema.invoices.id, invoice.id));

      const finalizedEventPayload = InvoiceFinalizedEventSchema.parse({
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        actorUserId: dto.actorUserId,
        correlationId: dto.correlationId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        currency: invoice.currency || 'LKR',
        netRevenueAmount: String(invoice.subtotalAmount),
        totalDiscountAmount: String(invoice.discountAmount || '0.00'),
        totalTaxAmount: String(invoice.taxAmount),
        grossReceivableAmount: String(invoice.totalAmount),
        totalCogsAmount: totalCogsValuation,
      });

      const outboxRow = await this.outboxService.enqueue(
        tx,
        salesCrmSchema.salesCrmOutboxEvents,
        {
          tenantId: dto.tenantId,
          actorUserId: dto.actorUserId,
          sourceService: 'svc-crm-sales',
          aggregateType: 'INVOICE',
          aggregateId: invoice.id,
          eventName: ERP_EVENT_PATTERNS.INVOICE_FINALIZED,
          correlationId: dto.correlationId,
          payload: finalizedEventPayload,
        },
      );

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: 'FINALIZED' as const,
        grossReceivableAmount: finalizedEventPayload.grossReceivableAmount,
        totalCogsAmount: totalCogsValuation,
        outboxEventId: outboxRow.id,
      };
    });
  }

  /**
   * Synchronous RPC (`sales_crm.convert_quote_to_invoice`):
   * Converts an accepted quotation into a DRAFT invoice.
   */
  @MessagePattern(ERP_RPC_PATTERNS.SALES_CRM.CONVERT_QUOTE_TO_INVOICE)
  async convertQuoteToInvoice(@Payload() rawPayload: ConvertQuoteToInvoiceDto) {
    const dto = ConvertQuoteToInvoiceSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const quoteRows = await tx
        .select()
        .from(salesCrmSchema.quotations)
        .where(
          and(
            eq(salesCrmSchema.quotations.tenantId, dto.tenantId),
            eq(salesCrmSchema.quotations.id, dto.quotationId),
          ),
        );

      const quote = quoteRows[0];
      if (!quote) {
        throw new ErpRpcException('QUOTATION_NOT_FOUND', `Quotation ${dto.quotationId} not found`, 404);
      }

      await tx
        .update(salesCrmSchema.quotations)
        .set({ status: 'CONVERTED', updatedAt: new Date() })
        .where(eq(salesCrmSchema.quotations.id, quote.id));

      const [invoice] = await tx
        .insert(salesCrmSchema.invoices)
        .values({
          tenantId: dto.tenantId,
          invoiceNumber: `INV-Q-${quote.quoteNumber}`,
          customerId: quote.customerId,
          warehouseId: dto.warehouseId,
          currency: 'LKR',
          invoiceDate: new Date(),
          subtotalAmount: quote.subtotalAmount,
          discountAmount: quote.discountAmount,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          totalCogsAmount: '0.00',
          status: 'DRAFT',
          notes: quote.notes,
        })
        .returning();

      return {
        quotationId: quote.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
      };
    });
  }

  /**
   * Synchronous RPC (`sales_crm.create_sla_ticket`):
   * Opens a customer SLA complaint ticket with deterministic resolution deadline.
   */
  @MessagePattern(ERP_RPC_PATTERNS.SALES_CRM.CREATE_SLA_TICKET)
  async createSlaTicket(@Payload() rawPayload: CreateSlaTicketDto) {
    const dto = CreateSlaTicketSchema.parse(rawPayload);
    const slaDeadline = calculateSlaDeadline(dto.severity);

    const [ticket] = await this.db
      .insert(salesCrmSchema.complaintTickets)
      .values({
        tenantId: dto.tenantId,
        customerId: dto.customerId,
        subject: dto.subject,
        description: dto.description,
        severity: dto.severity,
        status: 'OPEN',
        slaDeadline,
      })
      .returning();

    return {
      ticketId: ticket.id,
      severity: ticket.severity,
      status: ticket.status,
      slaDeadline: slaDeadline.toISOString(),
    };
  }
}

@Module({
  imports: [DrizzleModule.forService('sales_crm', salesCrmSchema)],
  controllers: [CrmSalesController],
  providers: [OutboxService, InboxService],
})
export class CrmSalesModule {}

export async function startCrmSalesService(
  port = Number(process.env.SVC_SALES_CRM_HEALTH_PORT || 4007),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-crm-sales',
    schemaName: 'sales_crm',
    healthPort: port,
    appModule: CrmSalesModule,
  });
}

if (require.main === module) {
  startCrmSalesService().catch((err) => {
    console.error('Failed to start svc-crm-sales:', err);
    process.exit(1);
  });
}
