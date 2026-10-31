import Decimal from 'decimal.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { accounts, journalEntries, journalLines } from '@zynveo/database';

export interface JournalLineInput {
  accountId: string;
  debit: string;
  credit: string;
  description?: string;
}

export interface DoubleEntryBalanceResult {
  balanced: true;
  totalDebit: string;
  totalCredit: string;
}

/**
 * Pure Decimal double-entry invariant check:
 * Verifies Sum(Debits).equals(Sum(Credits)) with zero floating-point arithmetic.
 */
export function verifyDoubleEntryBalance(lines: JournalLineInput[]): DoubleEntryBalanceResult {
  if (!lines || lines.length < 2) {
    throw new Error('A double-entry journal entry requires at least 2 lines.');
  }

  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);

  for (const line of lines) {
    const debit = new Decimal(line.debit || '0');
    const credit = new Decimal(line.credit || '0');

    if (debit.isNegative() || credit.isNegative()) {
      throw new Error('Journal line debit and credit amounts must be non-negative.');
    }
    if (debit.gt(0) && credit.gt(0)) {
      throw new Error(
        `Journal line for account ${line.accountId} cannot have both positive debit (${debit.toFixed(2)}) and credit (${credit.toFixed(2)}).`,
      );
    }
    if (debit.isZero() && credit.isZero()) {
      throw new Error(`Journal line for account ${line.accountId} cannot have zero debit and zero credit.`);
    }

    totalDebit = totalDebit.plus(debit);
    totalCredit = totalCredit.plus(credit);
  }

  const roundedDebit = totalDebit.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const roundedCredit = totalCredit.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  if (!roundedDebit.equals(roundedCredit)) {
    throw new Error(
      `Unbalanced journal entry: Debits (${roundedDebit.toFixed(2)}) do not equal Credits (${roundedCredit.toFixed(2)})`,
    );
  }

  if (roundedDebit.lte(0)) {
    throw new Error('Journal entry total must be strictly greater than 0.00.');
  }

  return {
    balanced: true,
    totalDebit: roundedDebit.toFixed(2),
    totalCredit: roundedCredit.toFixed(2),
  };
}

export interface InvoicePostingAccountMap {
  accountsReceivableAccountId: string;
  salesRevenueAccountId: string;
  taxPayableAccountId: string;
  cogsExpenseAccountId: string;
  inventoryAssetAccountId: string;
}

/**
 * Builds the automated Double-Entry Journal lines for an `invoice.finalized` event:
 *   Dr Accounts Receivable (grossTotal = netSubtotal + taxTotal)
 *   Cr Sales Revenue       (netSubtotal)
 *   Cr Tax Payable         (taxTotal, if > 0)
 *   Dr COGS Expense        (totalCogs, if > 0)
 *   Cr Inventory Asset     (totalCogs, if > 0)
 */
export function buildInvoiceFinalizedJournalLines(
  payload: {
    invoiceNumber: string;
    netSubtotal: string;
    taxTotal: string;
    grossTotal: string;
    totalCogs: string;
  },
  accountMap: InvoicePostingAccountMap,
): JournalLineInput[] {
  const netSubtotal = new Decimal(payload.netSubtotal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const taxTotal = new Decimal(payload.taxTotal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const grossTotal = new Decimal(payload.grossTotal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalCogs = new Decimal(payload.totalCogs).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  if (!netSubtotal.plus(taxTotal).equals(grossTotal)) {
    throw new Error(
      `Invoice ${payload.invoiceNumber} math mismatch: netSubtotal (${netSubtotal.toFixed(2)}) + taxTotal (${taxTotal.toFixed(2)}) != grossTotal (${grossTotal.toFixed(2)})`,
    );
  }

  const lines: JournalLineInput[] = [
    {
      accountId: accountMap.accountsReceivableAccountId,
      debit: grossTotal.toFixed(2),
      credit: '0.00',
      description: `AR — Invoice ${payload.invoiceNumber}`,
    },
    {
      accountId: accountMap.salesRevenueAccountId,
      debit: '0.00',
      credit: netSubtotal.toFixed(2),
      description: `Sales Revenue — Invoice ${payload.invoiceNumber}`,
    },
  ];

  if (taxTotal.gt(0)) {
    lines.push({
      accountId: accountMap.taxPayableAccountId,
      debit: '0.00',
      credit: taxTotal.toFixed(2),
      description: `Output Tax Payable — Invoice ${payload.invoiceNumber}`,
    });
  }

  if (totalCogs.gt(0)) {
    lines.push(
      {
        accountId: accountMap.cogsExpenseAccountId,
        debit: totalCogs.toFixed(2),
        credit: '0.00',
        description: `COGS — Invoice ${payload.invoiceNumber}`,
      },
      {
        accountId: accountMap.inventoryAssetAccountId,
        debit: '0.00',
        credit: totalCogs.toFixed(2),
        description: `Inventory Relief — Invoice ${payload.invoiceNumber}`,
      },
    );
  }

  verifyDoubleEntryBalance(lines);
  return lines;
}

export class AccountingService {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Posts a double-entry journal ensuring debits equal credits using Decimal.
   */
  async postJournalEntry(
    tenantId: string,
    entryNumber: string,
    description: string,
    lines: Array<{ accountId: string; debit: number | string; credit: number | string; description?: string }>,
  ) {
    const normalizedLines: JournalLineInput[] = lines.map((line) => ({
      accountId: line.accountId,
      debit: new Decimal(line.debit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      credit: new Decimal(line.credit).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      description: line.description,
    }));

    verifyDoubleEntryBalance(normalizedLines);

    return await this.db.transaction(async (tx: any) => {
      const [entry] = await tx
        .insert(journalEntries)
        .values({
          tenantId,
          entryNumber,
          description,
          status: 'POSTED',
          date: new Date(),
        })
        .returning();

      const mappedLines = normalizedLines.map((line) => ({
        tenantId,
        journalEntryId: entry.id,
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description || '',
      }));

      await tx.insert(journalLines).values(mappedLines);

      return entry;
    });
  }

  /**
   * Create a new General Ledger Account
   */
  async createAccount(
    tenantId: string,
    data: {
      code: string;
      name: string;
      type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
      normalBalance: 'debit' | 'credit' | 'DEBIT' | 'CREDIT';
    },
  ) {
    const [account] = await this.db
      .insert(accounts as any)
      .values({
        tenantId,
        code: data.code,
        name: data.name,
        type: data.type.toUpperCase(),
        normalBalance: data.normalBalance.toUpperCase(),
      })
      .returning();
    return account;
  }
}
