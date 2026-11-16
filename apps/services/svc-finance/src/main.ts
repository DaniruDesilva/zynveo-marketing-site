import Decimal from 'decimal.js';
import { and, desc, eq, isNull } from 'drizzle-orm';
import {
  BalanceSheetResponse,
  CheckCustomerCreditDto,
  CheckCustomerCreditResponse,
  CheckCustomerCreditSchema,
  CreateAccountDto,
  CreateAccountSchema,
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
  RecordPaymentDto,
  RecordPaymentSchema,
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
  { code: '1000', name: 'Cash & Bank', type: 'ASSET' as const, normalBalance: 'DEBIT' as const },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET' as const, normalBalance: 'DEBIT' as const },
  { code: '1300', name: 'Inventory Asset', type: 'ASSET' as const, normalBalance: 'DEBIT' as const },
  { code: '2000', name: 'Accounts Payable (GRNI)', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '2100', name: 'Output Tax Payable', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '2200', name: 'Net Salaries Payable', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '2210', name: 'Statutory EPF/ETF/APIT Payable', type: 'LIABILITY' as const, normalBalance: 'CREDIT' as const },
  { code: '3000', name: 'Retained Earnings', type: 'EQUITY' as const, normalBalance: 'CREDIT' as const },
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
          isNull(financeSchema.accountsReceivable.deletedAt),
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

    const rawAccountRows = await this.db
      .select()
      .from(financeSchema.accounts)
      .where(
        and(
          eq(financeSchema.accounts.tenantId, dto.tenantId),
          isNull(financeSchema.accounts.deletedAt),
        ),
      );
    const accountRows = [...rawAccountRows]
      .filter((a: any) => !a.deletedAt)
      .sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)));

    const lineRows = await this.db
      .select()
      .from(financeSchema.journalLines)
      .where(
        and(
          eq(financeSchema.journalLines.tenantId, dto.tenantId),
          isNull(financeSchema.journalLines.deletedAt),
        ),
      );

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

  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.LIST_ACCOUNTS)
  async listAccounts(@Payload() rawPayload: { tenantId: string }) {
    const existing = await this.db
      .select()
      .from(financeSchema.accounts)
      .where(
        and(
          eq(financeSchema.accounts.tenantId, rawPayload.tenantId),
          isNull(financeSchema.accounts.deletedAt),
        ),
      );

    if (existing.length === 0) {
      await this.db.transaction(async (tx: any) => {
        await this.resolveOrSeedPostingAccounts(tx, rawPayload.tenantId);
      });
    }

    const rawAccounts = await this.db
      .select()
      .from(financeSchema.accounts)
      .where(
        and(
          eq(financeSchema.accounts.tenantId, rawPayload.tenantId),
          isNull(financeSchema.accounts.deletedAt),
        ),
      );
    const accountRows = [...rawAccounts]
      .filter((a: any) => !a.deletedAt)
      .sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)));

    const lineRows = await this.db
      .select()
      .from(financeSchema.journalLines)
      .where(
        and(
          eq(financeSchema.journalLines.tenantId, rawPayload.tenantId),
          isNull(financeSchema.journalLines.deletedAt),
        ),
      );

    return accountRows.map((acct: any) => {
      let debits = new Decimal(0);
      let credits = new Decimal(0);
      for (const l of lineRows) {
        if (l.accountId === acct.id && !l.deletedAt) {
          debits = debits.plus(new Decimal(l.debit || '0'));
          credits = credits.plus(new Decimal(l.credit || '0'));
        }
      }
      return {
        id: acct.id,
        code: acct.code,
        name: acct.name,
        type: String(acct.type).toUpperCase(),
        normalBalance: String(acct.normalBalance).toUpperCase(),
        description: acct.description ?? null,
        isActive: acct.isActive,
        totalDebits: debits.toFixed(2),
        totalCredits: credits.toFixed(2),
      };
    });
  }

  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.CREATE_ACCOUNT)
  async createAccount(@Payload() rawPayload: CreateAccountDto) {
    const dto = CreateAccountSchema.parse(rawPayload);

    const existing = await this.db
      .select()
      .from(financeSchema.accounts)
      .where(
        and(
          eq(financeSchema.accounts.tenantId, dto.tenantId),
          eq(financeSchema.accounts.code, dto.code),
          isNull(financeSchema.accounts.deletedAt),
        ),
      );

    if (existing.length > 0) {
      throw new ErpRpcException(
        'ACCOUNT_CODE_EXISTS',
        `GL Account code ${dto.code} already exists for tenant`,
        409,
      );
    }

    const normalBalance =
      dto.normalBalance ||
      (dto.type === 'ASSET' || dto.type === 'EXPENSE' ? 'DEBIT' : 'CREDIT');

    const [created] = await this.db
      .insert(financeSchema.accounts)
      .values({
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        normalBalance,
        description: dto.description ?? null,
        parentId: dto.parentId ?? null,
        isActive: true,
      })
      .returning();

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      type: String(created.type).toUpperCase(),
      normalBalance: String(created.normalBalance).toUpperCase(),
      description: created.description ?? null,
      isActive: created.isActive,
      totalDebits: '0.00',
      totalCredits: '0.00',
    };
  }

  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.LIST_JOURNALS)
  async listJournals(@Payload() rawPayload: { tenantId: string }) {
    const entries = await this.db
      .select()
      .from(financeSchema.journalEntries)
      .where(
        and(
          eq(financeSchema.journalEntries.tenantId, rawPayload.tenantId),
          isNull(financeSchema.journalEntries.deletedAt),
        ),
      )
      .orderBy(desc(financeSchema.journalEntries.date), desc(financeSchema.journalEntries.createdAt));

    const allLines = await this.db
      .select()
      .from(financeSchema.journalLines)
      .where(
        and(
          eq(financeSchema.journalLines.tenantId, rawPayload.tenantId),
          isNull(financeSchema.journalLines.deletedAt),
        ),
      );

    return entries.map((entry: any) => {
      let totalDebit = new Decimal(0);
      let lineCount = 0;
      for (const l of allLines) {
        if (l.journalEntryId === entry.id) {
          totalDebit = totalDebit.plus(new Decimal(l.debit || '0'));
          lineCount += 1;
        }
      }
      return {
        id: entry.id,
        entryNumber: entry.entryNumber,
        date: entry.date instanceof Date ? entry.date.toISOString() : String(entry.date),
        description: entry.description,
        reference: entry.reference,
        sourceModule: entry.sourceModule,
        status: String(entry.status).toUpperCase(),
        totalAmount: totalDebit.toFixed(2),
        lineCount,
      };
    });
  }

  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.GET_JOURNAL_DETAIL)
  async getJournalDetail(@Payload() rawPayload: { tenantId: string; journalEntryId: string }) {
    const [entry] = await this.db
      .select()
      .from(financeSchema.journalEntries)
      .where(
        and(
          eq(financeSchema.journalEntries.tenantId, rawPayload.tenantId),
          eq(financeSchema.journalEntries.id, rawPayload.journalEntryId),
          isNull(financeSchema.journalEntries.deletedAt),
        ),
      );

    if (!entry) {
      throw new ErpRpcException('JOURNAL_NOT_FOUND', 'Journal entry not found', 404);
    }

    const lines = await this.db
      .select({
        id: financeSchema.journalLines.id,
        accountId: financeSchema.journalLines.accountId,
        accountCode: financeSchema.accounts.code,
        accountName: financeSchema.accounts.name,
        debit: financeSchema.journalLines.debit,
        credit: financeSchema.journalLines.credit,
        description: financeSchema.journalLines.description,
      })
      .from(financeSchema.journalLines)
      .leftJoin(financeSchema.accounts, eq(financeSchema.journalLines.accountId, financeSchema.accounts.id))
      .where(
        and(
          eq(financeSchema.journalLines.tenantId, rawPayload.tenantId),
          eq(financeSchema.journalLines.journalEntryId, entry.id),
          isNull(financeSchema.journalLines.deletedAt),
        ),
      );

    return {
      id: entry.id,
      entryNumber: entry.entryNumber,
      date: entry.date instanceof Date ? entry.date.toISOString() : String(entry.date),
      description: entry.description,
      reference: entry.reference,
      sourceModule: entry.sourceModule,
      status: String(entry.status).toUpperCase(),
      lines,
    };
  }

  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.GET_BALANCE_SHEET)
  async getBalanceSheet(@Payload() rawPayload: { tenantId: string; asOfDate?: string }): Promise<BalanceSheetResponse> {
    const tb = await this.getTrialBalance({
      tenantId: rawPayload.tenantId,
      actorUserId: rawPayload.tenantId,
      asOfDate: rawPayload.asOfDate,
    });

    const assets: Array<{ accountId: string; code: string; name: string; amount: string }> = [];
    const liabilities: Array<{ accountId: string; code: string; name: string; amount: string }> = [];
    const equity: Array<{ accountId: string; code: string; name: string; amount: string }> = [];

    let totalAssets = new Decimal(0);
    let totalLiabilities = new Decimal(0);
    let totalEquity = new Decimal(0);
    let totalRevenue = new Decimal(0);
    let totalExpense = new Decimal(0);

    for (const row of tb.rows) {
      const deb = new Decimal(row.totalDebit);
      const cred = new Decimal(row.totalCredit);
      if (row.accountType === 'ASSET') {
        const bal = deb.minus(cred);
        totalAssets = totalAssets.plus(bal);
        assets.push({ accountId: row.accountId, code: row.accountCode, name: row.accountName, amount: bal.toFixed(2) });
      } else if (row.accountType === 'LIABILITY') {
        const bal = cred.minus(deb);
        totalLiabilities = totalLiabilities.plus(bal);
        liabilities.push({ accountId: row.accountId, code: row.accountCode, name: row.accountName, amount: bal.toFixed(2) });
      } else if (row.accountType === 'EQUITY') {
        const bal = cred.minus(deb);
        totalEquity = totalEquity.plus(bal);
        equity.push({ accountId: row.accountId, code: row.accountCode, name: row.accountName, amount: bal.toFixed(2) });
      } else if (row.accountType === 'REVENUE') {
        totalRevenue = totalRevenue.plus(cred.minus(deb));
      } else if (row.accountType === 'EXPENSE') {
        totalExpense = totalExpense.plus(deb.minus(cred));
      }
    }

    const retainedEarningsCurrentPeriod = totalRevenue.minus(totalExpense).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalEquityWithIncome = totalEquity.plus(retainedEarningsCurrentPeriod).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquityWithIncome).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      asOfDate: rawPayload.asOfDate || new Date().toISOString(),
      assets,
      liabilities,
      equity,
      totalAssets: totalAssets.toFixed(2),
      totalLiabilities: totalLiabilities.toFixed(2),
      totalEquity: totalEquityWithIncome.toFixed(2),
      retainedEarningsCurrentPeriod: retainedEarningsCurrentPeriod.toFixed(2),
      isBalanced: totalAssets.toDecimalPlaces(2).equals(totalLiabilitiesAndEquity),
    };
  }

  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.RECORD_PAYMENT)
  async recordPayment(@Payload() rawPayload: RecordPaymentDto) {
    const dto = RecordPaymentSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const accountMap = await this.resolveOrSeedPostingAccounts(tx, dto.tenantId);

      const bankAccts = await tx
        .select()
        .from(financeSchema.accounts)
        .where(
          and(
            eq(financeSchema.accounts.tenantId, dto.tenantId),
            eq(financeSchema.accounts.code, dto.bankAccountCode),
            isNull(financeSchema.accounts.deletedAt),
          ),
        );

      let bankAccount = bankAccts[0];
      if (!bankAccount) {
        const [created] = await tx
          .insert(financeSchema.accounts)
          .values({
            tenantId: dto.tenantId,
            code: dto.bankAccountCode,
            name: 'Cash & Bank',
            type: 'ASSET',
            normalBalance: 'DEBIT',
            isActive: true,
          })
          .returning();
        bankAccount = created;
      }

      const amt = new Decimal(dto.amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
      const isReceipt = dto.paymentType === 'CUSTOMER_RECEIPT';

      const journalLinesInput = isReceipt
        ? [
            {
              accountId: bankAccount.id,
              debit: amt,
              credit: '0.00',
              description: dto.notes || `Customer receipt ${dto.referenceNumber}`,
            },
            {
              accountId: accountMap.accountsReceivableAccountId,
              debit: '0.00',
              credit: amt,
              description: dto.notes || `AR settlement ${dto.referenceNumber}`,
            },
          ]
        : [
            {
              accountId: accountMap.accountsPayableAccountId,
              debit: amt,
              credit: '0.00',
              description: dto.notes || `AP settlement ${dto.referenceNumber}`,
            },
            {
              accountId: bankAccount.id,
              debit: '0.00',
              credit: amt,
              description: dto.notes || `Supplier disbursement ${dto.referenceNumber}`,
            },
          ];

      verifyDoubleEntryBalance(journalLinesInput);

      const [entry] = await tx
        .insert(financeSchema.journalEntries)
        .values({
          tenantId: dto.tenantId,
          entryNumber: dto.referenceNumber,
          date: new Date(dto.paymentDate),
          description: dto.notes || (isReceipt ? 'Customer Payment Receipt' : 'Supplier Payment Disbursement'),
          reference: dto.referenceNumber,
          sourceModule: 'MANUAL',
          sourceDocumentId: dto.invoiceId ?? dto.supplierBillId ?? null,
          status: 'POSTED',
          postedByUserId: dto.actorUserId,
        })
        .returning();

      await tx.insert(financeSchema.journalLines).values(
        journalLinesInput.map((l) => ({
          tenantId: dto.tenantId,
          journalEntryId: entry.id,
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          description: l.description,
        })),
      );

      if (isReceipt && dto.invoiceId) {
        const arRows = await tx
          .select()
          .from(financeSchema.accountsReceivable)
          .where(
            and(
              eq(financeSchema.accountsReceivable.tenantId, dto.tenantId),
              eq(financeSchema.accountsReceivable.invoiceId, dto.invoiceId),
              isNull(financeSchema.accountsReceivable.deletedAt),
            ),
          );
        if (arRows[0]) {
          const paid = new Decimal(arRows[0].paidAmount || '0').plus(new Decimal(amt));
          const orig = new Decimal(arRows[0].originalAmount || '0');
          const balance = Decimal.max(new Decimal(0), orig.minus(paid));
          await tx
            .update(financeSchema.accountsReceivable)
            .set({
              paidAmount: paid.toFixed(2),
              balanceAmount: balance.toFixed(2),
              status: balance.equals(0) ? 'PAID' : 'PARTIALLY_PAID',
              updatedAt: new Date(),
            })
            .where(eq(financeSchema.accountsReceivable.id, arRows[0].id));
        }
      }

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
          paymentType: dto.paymentType,
          amount: amt,
        },
      });

      return {
        journalEntryId: entry.id,
        entryNumber: entry.entryNumber,
        paymentType: dto.paymentType,
        amount: amt,
        status: 'POSTED' as const,
        outboxEventId: outboxRow.id,
      };
    });
  }

  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.LIST_AR_INVOICES)
  async listArInvoices(@Payload() rawPayload: { tenantId: string }) {
    return this.db
      .select()
      .from(financeSchema.accountsReceivable)
      .where(
        and(
          eq(financeSchema.accountsReceivable.tenantId, rawPayload.tenantId),
          isNull(financeSchema.accountsReceivable.deletedAt),
        ),
      )
      .orderBy(desc(financeSchema.accountsReceivable.createdAt));
  }

  @MessagePattern(ERP_RPC_PATTERNS.FINANCE.LIST_AP_BILLS)
  async listApBills(@Payload() rawPayload: { tenantId: string }) {
    return this.db
      .select()
      .from(financeSchema.accountsPayable)
      .where(
        and(
          eq(financeSchema.accountsPayable.tenantId, rawPayload.tenantId),
          isNull(financeSchema.accountsPayable.deletedAt),
        ),
      )
      .orderBy(desc(financeSchema.accountsPayable.createdAt));
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
      .where(
        and(
          eq(financeSchema.accounts.tenantId, tenantId),
          isNull(financeSchema.accounts.deletedAt),
        ),
      );

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
