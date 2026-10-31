import Decimal from 'decimal.js';
import { and, eq } from 'drizzle-orm';
import {
  CheckCustomerCreditDto,
  CheckCustomerCreditResponse,
  CheckCustomerCreditSchema,
  ERP_EVENT_PATTERNS,
  ERP_RPC_PATTERNS,
  EventEnvelope,
  GetTrialBalanceDto,
  GetTrialBalanceSchema,
  GrnApprovedEvent,
  GrnApprovedEventSchema,
  InvoiceFinalizedEvent,
  InvoiceFinalizedEventSchema,
  PayrollDisbursedEvent,
  PayrollDisbursedEventSchema,
  PostJournalEntryDto,
  PostJournalEntrySchema,
  TrialBalanceResponse,
  WorkOrderCompletedEvent,
  WorkOrderCompletedEventSchema,
} from '@zynveo/contracts';
import {
  buildInvoiceFinalizedJournalLines,
  verifyDoubleEntryBalance,
} from '@zynveo/core-accounting';
import * as financeSchema from '@zynveo/database/finance';
import {
  Controller,
  DRIZZLE_DB,
  DrizzleModule,
  ErpRpcException,
  EventPattern,
  InboxService,
  Inject,
  MessagePattern,
  Module,
  OutboxService,
  Payload,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

const DEFAULT_COA_SPECS = [
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET' as const, normalBalance: 'DEBIT' as const },
  { code: '1300', name: 'Inventory Asset', type: 'ASSET' as const, normalBalance: 'DEBIT' as const },
  { code: '2000', name: 'Accounts Payable (GRNI)', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '2100', name: 'Output Tax Payable', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '2200', name: 'Net Salaries Payable', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '2210', name: 'Statutory EPF/ETF/APIT Payable', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE' as const, normalBalance: 'CREDIT' as const },
  { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' as const, normalBalance: 'DEBIT' as const },
  { code: '5100', name: 'Production Absorption / WIP', type: 'EXPENSE' as const, normalBalance: 'CREDIT' as const },
  { code: '5200', name: 'Salaries & Wages Expense', type: 'EXPENSE' as const, normalBalance: 'DEBIT' as const },
  { code: '5210', name: 'Employer EPF/ETF Contribution Expense', type: 'EXPENSE' as const, normalBalance: 'DEBIT' as const },
];

@Controller()
export class FinanceController {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: any,
    private readonly outboxService: OutboxService,
    private readonly inboxService: InboxService,
  ) {}

  /**
   * Synchronous RPC: Posts a manual or sub-ledger double-entry journal entry.
   * Enforces Sum(Debits).equals(Sum(Credits)) using Decimal inside a PostgreSQL transaction.
   */
  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.POST_JOURNAL_ENTRY)
  async postJournalEntry(@Payload() rawPayload: PostJournalEntryDto) {
    const dto = PostJournalEntrySchema.parse(rawPayload);

    const balanceCheck = verifyDoubleEntryBalance(
      dto.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
      })),
    );

    return this.db.transaction(async (tx: any) => {
      const [entry] = await tx
        .insert(financeSchema.journalEntries)
        .values({
          tenantId: dto.tenantId,
          entryNumber: dto.referenceNumber,
          date: new Date(dto.postingDate),
          description: dto.narration,
          reference: dto.referenceNumber,
          sourceModule: dto.sourceModule,
          sourceDocumentId: dto.sourceDocumentId ?? null,
          status: 'POSTED',
          postedByUserId: dto.actorUserId,
        })
        .returning();

      const lineRows = dto.lines.map((line) => ({
        tenantId: dto.tenantId,
        journalEntryId: entry.id,
        accountId: line.accountId,
        debit: new Decimal(line.debit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
        credit: new Decimal(line.credit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
        description: line.description ?? dto.narration,
      }));

      await tx.insert(financeSchema.journalLines).values(lineRows);

      const outboxRow = await this.outboxService.enqueue(tx, financeSchema.financeOutboxEvents, {
        tenantId: dto.tenantId,
        actorUserId: dto.actorUserId,
        sourceService: 'svc-finance',
        aggregateType: 'JOURNAL_ENTRY',
        aggregateId: entry.id,
        eventName: ERP_EVENT_PATTERNS.JOURNAL_POSTED,
        correlationId: dto.correlationId,
        payload: {
          journalEntryId: entry.id,
          referenceNumber: dto.referenceNumber,
          sourceModule: dto.sourceModule,
          totalDebit: balanceCheck.totalDebit,
          totalCredit: balanceCheck.totalCredit,
        },
      });

      return {
        journalEntryId: entry.id,
        entryNumber: entry.entryNumber,
        status: 'POSTED' as const,
        totalDebit: balanceCheck.totalDebit,
        totalCredit: balanceCheck.totalCredit,
        outboxEventId: outboxRow.id,
      };
    });
  }

  /**
   * Synchronous RPC: Checks whether a customer has sufficient credit headroom for an order/invoice.
   */
  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.CHECK_CUSTOMER_CREDIT)
  async checkCustomerCredit(
    @Payload() rawPayload: CheckCustomerCreditDto,
  ): Promise<CheckCustomerCreditResponse> {
    const dto = CheckCustomerCreditSchema.parse(rawPayload);

    const openReceivables = await this.db
      .select()
      .from(financeSchema.accountsReceivable)
      .where(
        and(
          eq(financeSchema.accountsReceivable.tenantId, dto.tenantId),
          eq(financeSchema.accountsReceivable.customerId, dto.customerId),
        ),
      );

    let currentReceivable = new Decimal(0);
    for (const row of openReceivables) {
      if (String(row.status).toUpperCase() !== 'PAID' && !row.deletedAt) {
        currentReceivable = currentReceivable.plus(new Decimal(row.balanceAmount || '0'));
      }
    }

    const creditLimit = new Decimal(process.env.DEFAULT_CUSTOMER_CREDIT_LIMIT || '500000.00');
    const orderAmount = new Decimal(dto.additionalOrderAmount);
    const availableCredit = creditLimit.minus(currentReceivable);
    const projectedExposure = currentReceivable.plus(orderAmount);
    const approved = projectedExposure.lte(creditLimit);

    return {
      approved,
      creditLimit: creditLimit.toFixed(2),
      currentReceivableBalance: currentReceivable.toFixed(2),
      availableCredit: availableCredit.toFixed(2),
      reason: approved
        ? undefined
        : `Order amount (${orderAmount.toFixed(2)}) exceeds available credit (${availableCredit.toFixed(2)})`,
    };
  }

  /**
   * Synchronous RPC: Computes the General Ledger Trial Balance using Decimal arithmetic.
   */
  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.GET_TRIAL_BALANCE)
  async getTrialBalance(@Payload() rawPayload: GetTrialBalanceDto): Promise<TrialBalanceResponse> {
    const dto = GetTrialBalanceSchema.parse(rawPayload);

    const accountRows = await this.db
      .select()
      .from(financeSchema.accounts)
      .where(eq(financeSchema.accounts.tenantId, dto.tenantId));

    const lineRows = await this.db
      .select()
      .from(financeSchema.journalLines)
      .where(eq(financeSchema.journalLines.tenantId, dto.tenantId));

    let grandTotalDebit = new Decimal(0);
    let grandTotalCredit = new Decimal(0);

    const rows = accountRows.map((acct: any) => {
      const acctLines = lineRows.filter((l: any) => l.accountId === acct.id && !l.deletedAt);
      let acctDebit = new Decimal(0);
      let acctCredit = new Decimal(0);

      for (const line of acctLines) {
        acctDebit = acctDebit.plus(new Decimal(line.debit || '0'));
        acctCredit = acctCredit.plus(new Decimal(line.credit || '0'));
      }

      grandTotalDebit = grandTotalDebit.plus(acctDebit);
      grandTotalCredit = grandTotalCredit.plus(acctCredit);

      const normalBal = String(acct.normalBalance).toUpperCase() as 'DEBIT' | 'CREDIT';
      const netBalance =
        normalBal === 'DEBIT' ? acctDebit.minus(acctCredit) : acctCredit.minus(acctDebit);

      return {
        accountId: acct.id,
        accountCode: acct.code,
        accountName: acct.name,
        accountType: String(acct.type).toUpperCase() as any,
        normalBalance: normalBal,
        totalDebit: acctDebit.toFixed(2),
        totalCredit: acctCredit.toFixed(2),
        netBalance: netBalance.toFixed(2),
      };
    });

    return {
      isBalanced: grandTotalDebit.equals(grandTotalCredit),
      totalDebit: grandTotalDebit.toFixed(2),
      totalCredit: grandTotalCredit.toFixed(2),
      rows,
    };
  }

  /**
   * BullMQ Durable Consumer (`ERP_EVENT_PATTERNS.INVOICE_FINALIZED`):
   * Idempotently posts the 4-to-5 line Double-Entry Journal (AR, Sales Revenue, Tax Payable, COGS, Inventory Asset)
   * and records the open Receivable in `finance.accounts_receivable`.
   */
  @EventPattern(ERP_EVENT_PATTERNS.INVOICE_FINALIZED)
  async handleInvoiceFinalized(@Payload() envelope: EventEnvelope<InvoiceFinalizedEvent>) {
    const event = InvoiceFinalizedEventSchema.parse(envelope.payload);

    return this.inboxService.consumeIdempotently(
      this.db,
      financeSchema.financeProcessedEvents,
      'svc-finance',
      envelope,
      async (tx: any) => {
        const accountMap = await this.resolveOrSeedPostingAccounts(tx, event.tenantId);

        const journalLinesInput = buildInvoiceFinalizedJournalLines(
          {
            invoiceNumber: event.invoiceNumber,
            netSubtotal: event.netRevenueAmount,
            taxTotal: event.totalTaxAmount,
            grossTotal: event.grossReceivableAmount,
            totalCogs: event.totalCogsAmount,
          },
          accountMap,
        );

        const [entry] = await tx
          .insert(financeSchema.journalEntries)
          .values({
            tenantId: event.tenantId,
            entryNumber: `JE-INV-${event.invoiceNumber}`,
            date: new Date(),
            description: `Automated Sales & COGS Posting for Invoice ${event.invoiceNumber}`,
            reference: event.invoiceNumber,
            sourceModule: 'SALES',
            sourceDocumentId: event.invoiceId,
            status: 'POSTED',
            postedByUserId: event.actorUserId,
          })
          .returning();

        await tx.insert(financeSchema.journalLines).values(
          journalLinesInput.map((line) => ({
            tenantId: event.tenantId,
            journalEntryId: entry.id,
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
          })),
        );

        const [receivable] = await tx
          .insert(financeSchema.accountsReceivable)
          .values({
            tenantId: event.tenantId,
            customerId: event.customerId,
            invoiceId: event.invoiceId,
            invoiceNumber: event.invoiceNumber,
            journalEntryId: entry.id,
            originalAmount: event.grossReceivableAmount,
            paidAmount: '0.00',
            balanceAmount: event.grossReceivableAmount,
            status: 'OPEN',
          })
          .returning();

        await this.outboxService.enqueue(tx, financeSchema.financeOutboxEvents, {
          tenantId: event.tenantId,
          actorUserId: event.actorUserId,
          sourceService: 'svc-finance',
          aggregateType: 'JOURNAL_ENTRY',
          aggregateId: entry.id,
          eventName: ERP_EVENT_PATTERNS.JOURNAL_POSTED,
          correlationId: event.correlationId,
          payload: {
            journalEntryId: entry.id,
            invoiceId: event.invoiceId,
            receivableId: receivable.id,
            sourceModule: 'SALES',
          },
        });

        return {
          journalEntryId: entry.id,
          receivableId: receivable.id,
          lineCount: journalLinesInput.length,
        };
      },
    );
  }

  /**
   * BullMQ Durable Consumer (`event.scm.grn_approved`):
   * Idempotently posts the GRNI / Accounts Payable Double-Entry Journal:
   *   Dr 1300 Inventory Asset = totalAcceptedCost
   *   Cr 2000 Accounts Payable = totalAcceptedCost
   * and creates an open Payable in `finance.accounts_payable`.
   */
  @EventPattern(ERP_EVENT_PATTERNS.GRN_APPROVED)
  async handleGrnApproved(@Payload() envelope: EventEnvelope<GrnApprovedEvent>) {
    const event = GrnApprovedEventSchema.parse(envelope.payload);

    return this.inboxService.consumeIdempotently(
      this.db,
      financeSchema.financeProcessedEvents,
      'svc-finance',
      envelope,
      async (tx: any) => {
        const accountMap = await this.resolveOrSeedPostingAccounts(tx, event.tenantId);
        const amount = new Decimal(event.totalAcceptedCost)
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
          .toFixed(2);

        const lines = [
          {
            accountId: accountMap.inventoryAssetAccountId,
            debit: amount,
            credit: '0.00',
            description: `Inventory Receipt — GRN ${event.grnNumber}`,
          },
          {
            accountId: accountMap.accountsPayableAccountId,
            debit: '0.00',
            credit: amount,
            description: `Accounts Payable / GRNI — GRN ${event.grnNumber}`,
          },
        ];

        verifyDoubleEntryBalance(lines);

        const [entry] = await tx
          .insert(financeSchema.journalEntries)
          .values({
            tenantId: event.tenantId,
            entryNumber: `JE-GRN-${event.grnNumber}`,
            date: new Date(),
            description: `Automated Procurement GRN Posting for ${event.grnNumber}`,
            reference: event.grnNumber,
            sourceModule: 'PROCUREMENT',
            sourceDocumentId: event.grnId,
            status: 'POSTED',
            postedByUserId: event.actorUserId,
          })
          .returning();

        await tx.insert(financeSchema.journalLines).values(
          lines.map((l) => ({
            tenantId: event.tenantId,
            journalEntryId: entry.id,
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        );

        const [payable] = await tx
          .insert(financeSchema.accountsPayable)
          .values({
            tenantId: event.tenantId,
            supplierId: event.supplierId,
            grnId: event.grnId,
            referenceNumber: event.grnNumber,
            journalEntryId: entry.id,
            originalAmount: amount,
            paidAmount: '0.00',
            balanceAmount: amount,
            status: 'OPEN',
          })
          .returning();

        return { journalEntryId: entry.id, payableId: payable.id };
      },
    );
  }

  /**
   * BullMQ Durable Consumer (`event.mfg.work_order_completed`):
   * Idempotently posts the Production Absorption / Finished Goods Double-Entry Journal:
   *   Dr 1300 Inventory Asset (FG) = totalProductionCost
   *   Cr 5100 Production Absorption / WIP = totalProductionCost
   */
  @EventPattern(ERP_EVENT_PATTERNS.WORK_ORDER_COMPLETED)
  async handleWorkOrderCompleted(@Payload() envelope: EventEnvelope<WorkOrderCompletedEvent>) {
    const event = WorkOrderCompletedEventSchema.parse(envelope.payload);

    return this.inboxService.consumeIdempotently(
      this.db,
      financeSchema.financeProcessedEvents,
      'svc-finance',
      envelope,
      async (tx: any) => {
        const accountMap = await this.resolveOrSeedPostingAccounts(tx, event.tenantId);
        const amount = new Decimal(event.totalProductionCost)
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
          .toFixed(2);

        const lines = [
          {
            accountId: accountMap.inventoryAssetAccountId,
            debit: amount,
            credit: '0.00',
            description: `Finished Goods Yield — WO ${event.workOrderNumber}`,
          },
          {
            accountId: accountMap.productionWipAccountId,
            debit: '0.00',
            credit: amount,
            description: `Production Cost Absorption — WO ${event.workOrderNumber}`,
          },
        ];

        verifyDoubleEntryBalance(lines);

        const [entry] = await tx
          .insert(financeSchema.journalEntries)
          .values({
            tenantId: event.tenantId,
            entryNumber: `JE-WO-${event.workOrderNumber}`,
            date: new Date(),
            description: `Automated Manufacturing Costing for ${event.workOrderNumber}`,
            reference: event.workOrderNumber,
            sourceModule: 'MANUFACTURING',
            sourceDocumentId: event.workOrderId,
            status: 'POSTED',
            postedByUserId: event.actorUserId,
          })
          .returning();

        await tx.insert(financeSchema.journalLines).values(
          lines.map((l) => ({
            tenantId: event.tenantId,
            journalEntryId: entry.id,
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        );

        return { journalEntryId: entry.id };
      },
    );
  }

  /**
   * BullMQ Durable Consumer (`event.hr.payroll_disbursed`):
   * Idempotently posts the Statutory Payroll Double-Entry Journal:
   *   Dr 5200 Salaries & Wages Expense               = totalGrossSalary
   *   Dr 5210 Employer EPF (12%) & ETF (3%) Expense  = totalEmployerEpf12 + totalEmployerEtf3
   *   Cr 2200 Net Salaries Payable                   = totalNetPayable
   *   Cr 2210 Statutory EPF/ETF/APIT Payable         = totalEmployeeEpf8 + totalEmployerEpf12 + totalEmployerEtf3 + totalApitTax
   */
  @EventPattern(ERP_EVENT_PATTERNS.PAYROLL_DISBURSED)
  async handlePayrollDisbursed(@Payload() envelope: EventEnvelope<PayrollDisbursedEvent>) {
    const event = PayrollDisbursedEventSchema.parse(envelope.payload);

    return this.inboxService.consumeIdempotently(
      this.db,
      financeSchema.financeProcessedEvents,
      'svc-finance',
      envelope,
      async (tx: any) => {
        const accountMap = await this.resolveOrSeedPostingAccounts(tx, event.tenantId);

        const gross = new Decimal(event.totalGrossSalary);
        const empEpf8 = new Decimal(event.totalEmployeeEpf8);
        const emprEpf12 = new Decimal(event.totalEmployerEpf12);
        const emprEtf3 = new Decimal(event.totalEmployerEtf3);
        const apit = new Decimal(event.totalApitTax);
        const netPayable = new Decimal(event.totalNetPayable);

        const employerContribExpense = emprEpf12
          .plus(emprEtf3)
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        const statutoryPayable = empEpf8
          .plus(emprEpf12)
          .plus(emprEtf3)
          .plus(apit)
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

        const lines = [
          {
            accountId: accountMap.salariesExpenseAccountId,
            debit: gross.toFixed(2),
            credit: '0.00',
            description: `Gross Salaries Expense (${event.periodYear}-${event.periodMonth})`,
          },
          {
            accountId: accountMap.employerEpfEtfExpenseAccountId,
            debit: employerContribExpense.toFixed(2),
            credit: '0.00',
            description: `Employer EPF 12% & ETF 3% Expense (${event.periodYear}-${event.periodMonth})`,
          },
          {
            accountId: accountMap.netSalariesPayableAccountId,
            debit: '0.00',
            credit: netPayable.toFixed(2),
            description: `Net Salaries Payable (${event.periodYear}-${event.periodMonth})`,
          },
          {
            accountId: accountMap.statutoryPayableAccountId,
            debit: '0.00',
            credit: statutoryPayable.toFixed(2),
            description: `Statutory EPF/ETF/APIT Payable (${event.periodYear}-${event.periodMonth})`,
          },
        ];

        verifyDoubleEntryBalance(lines);

        const periodCode = `${event.periodYear}${String(event.periodMonth).padStart(2, '0')}`;
        const [entry] = await tx
          .insert(financeSchema.journalEntries)
          .values({
            tenantId: event.tenantId,
            entryNumber: `JE-PAY-${periodCode}`,
            date: new Date(),
            description: `Automated Statutory Payroll Posting (${event.periodYear}-${event.periodMonth})`,
            reference: `PAYROLL-${periodCode}`,
            sourceModule: 'HR_PAYROLL',
            sourceDocumentId: event.payrollRunId,
            status: 'POSTED',
            postedByUserId: event.actorUserId,
          })
          .returning();

        await tx.insert(financeSchema.journalLines).values(
          lines.map((l) => ({
            tenantId: event.tenantId,
            journalEntryId: entry.id,
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        );

        return { journalEntryId: entry.id, lineCount: lines.length };
      },
    );
  }

  private async resolveOrSeedPostingAccounts(tx: any, tenantId: string) {
    const existing = await tx
      .select()
      .from(financeSchema.accounts)
      .where(eq(financeSchema.accounts.tenantId, tenantId));

    const byCode = new Map<string, any>();
    for (const acct of existing) {
      byCode.set(acct.code, acct);
    }

    for (const spec of DEFAULT_COA_SPECS) {
      if (!byCode.has(spec.code)) {
        const [created] = await tx
          .insert(financeSchema.accounts)
          .values({
            tenantId,
            code: spec.code,
            name: spec.name,
            type: spec.type,
            normalBalance: spec.normalBalance,
            isActive: true,
          })
          .returning();
        byCode.set(spec.code, created);
      }
    }

    const ar = byCode.get('1100');
    const inv = byCode.get('1300');
    const ap = byCode.get('2000');
    const tax = byCode.get('2100');
    const salPay = byCode.get('2200');
    const statPay = byCode.get('2210');
    const rev = byCode.get('4000');
    const cogs = byCode.get('5000');
    const wip = byCode.get('5100');
    const salExp = byCode.get('5200');
    const epfExp = byCode.get('5210');

    if (!ar || !inv || !ap || !tax || !salPay || !statPay || !rev || !cogs || !wip || !salExp || !epfExp) {
      throw new ErpRpcException(
        'COA_MISSING',
        'Failed to resolve mandatory Chart of Accounts for automated posting',
        500,
      );
    }

    return {
      accountsReceivableAccountId: ar.id,
      inventoryAssetAccountId: inv.id,
      accountsPayableAccountId: ap.id,
      taxPayableAccountId: tax.id,
      netSalariesPayableAccountId: salPay.id,
      statutoryPayableAccountId: statPay.id,
      salesRevenueAccountId: rev.id,
      cogsExpenseAccountId: cogs.id,
      productionWipAccountId: wip.id,
      salariesExpenseAccountId: salExp.id,
      employerEpfEtfExpenseAccountId: epfExp.id,
    };
  }
}

@Module({
  imports: [DrizzleModule.forService('finance', financeSchema)],
  controllers: [FinanceController],
  providers: [OutboxService, InboxService],
})
export class FinanceModule {}

export async function startFinanceService(
  port = Number(process.env.SVC_FINANCE_HEALTH_PORT || 4002),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-finance',
    schemaName: 'finance',
    healthPort: port,
    appModule: FinanceModule,
  });
}

if (require.main === module) {
  startFinanceService().catch((err) => {
    console.error('Failed to start svc-finance:', err);
    process.exit(1);
  });
}
