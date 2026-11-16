import Decimal from 'decimal.js';
import { eq, and, sql, gte, lte, isNull, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  documents,
  journalEntries,
  journalLines,
  accounts,
  stockLevels,
  productVariants,
} from '@zynveo/database';

function formatMoney(value: unknown): string {
  if (value === null || value === undefined || value === '') return '0.00';
  return new Decimal(String(value)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export class ReportingService {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Generates a Sales Summary Report within a given date range using exact numeric/Decimal math.
   */
  async getSalesSummary(tenantId: string, startDate: Date, endDate: Date) {
    const results = await this.db
      .select({
        date: sql<Date>`date_trunc('day', ${documents.date})`,
        totalRevenue: sql<string>`coalesce(sum(${documents.total}), 0.00)::numeric(15,2)::text`,
        totalTax: sql<string>`coalesce(sum(${documents.taxTotal}), 0.00)::numeric(15,2)::text`,
        invoiceCount: sql<number>`count(${documents.id})::int`,
      })
      .from(documents)
      .where(
        and(
          eq(documents.tenantId, tenantId),
          inArray(documents.type, ['INVOICE', 'invoice']),
          inArray(documents.status, ['FINALIZED', 'PAID', 'SENT', 'sent', 'paid']),
          gte(documents.date, startDate),
          lte(documents.date, endDate),
          isNull(documents.deletedAt),
        ),
      )
      .groupBy(sql`date_trunc('day', ${documents.date})`)
      .orderBy(sql`date_trunc('day', ${documents.date})`);

    return results.map((r) => ({
      date: r.date,
      totalRevenue: formatMoney(r.totalRevenue),
      totalTax: formatMoney(r.totalTax),
      invoiceCount: Number(r.invoiceCount || 0),
    }));
  }

  /**
   * Real-Time Ledger Auditing: Finds any journal entries where Debits do not equal Credits.
   */
  async auditLedgerIntegrity(tenantId: string) {
    const unbalancedEntries = await this.db
      .select({
        journalEntryId: journalLines.journalEntryId,
        totalDebit: sql<string>`coalesce(sum(${journalLines.debit}), 0.00)::numeric(15,2)::text`,
        totalCredit: sql<string>`coalesce(sum(${journalLines.credit}), 0.00)::numeric(15,2)::text`,
        difference: sql<string>`abs(coalesce(sum(${journalLines.debit}), 0.00) - coalesce(sum(${journalLines.credit}), 0.00))::numeric(15,2)::text`,
      })
      .from(journalLines)
      .where(and(eq(journalLines.tenantId, tenantId), isNull(journalLines.deletedAt)))
      .groupBy(journalLines.journalEntryId)
      .having(sql`sum(${journalLines.debit}) != sum(${journalLines.credit})`);

    return {
      isHealthy: unbalancedEntries.length === 0,
      unbalancedEntries: unbalancedEntries.map((row) => ({
        journalEntryId: row.journalEntryId,
        totalDebit: formatMoney(row.totalDebit),
        totalCredit: formatMoney(row.totalCredit),
        difference: formatMoney(row.difference),
      })),
    };
  }

  /**
   * Generates a Profit & Loss summary using Decimal arithmetic.
   */
  async getProfitAndLoss(tenantId: string, startDate: Date, endDate: Date) {
    const pnl = await this.db
      .select({
        accountType: accounts.type,
        totalAmount: sql<string>`coalesce(sum(${journalLines.credit} - ${journalLines.debit}), 0.00)::numeric(15,2)::text`,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
      .where(
        and(
          eq(journalLines.tenantId, tenantId),
          gte(journalEntries.date, startDate),
          lte(journalEntries.date, endDate),
          isNull(journalLines.deletedAt),
          isNull(accounts.deletedAt),
          isNull(journalEntries.deletedAt),
        ),
      )
      .groupBy(accounts.type);

    let revenue = new Decimal(0);
    let expenses = new Decimal(0);

    for (const row of pnl) {
      const acctType = String(row.accountType || '').toUpperCase();
      const net = new Decimal(row.totalAmount || '0.00');
      if (acctType === 'REVENUE') {
        revenue = revenue.plus(net);
      } else if (acctType === 'EXPENSE') {
        expenses = expenses.minus(net);
      }
    }

    const netProfit = revenue.minus(expenses);

    return {
      revenue: revenue.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      expenses: expenses.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      netProfit: netProfit.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
    };
  }

  /**
   * Real-Time Inventory Valuation using Decimal/numeric precision.
   */
  async getInventoryValuation(tenantId: string): Promise<string> {
    const valuation = await this.db
      .select({
        totalValue: sql<string>`coalesce(sum(${stockLevels.quantity} * coalesce(nullif(${stockLevels.unitWacCost}, 0), ${productVariants.wacCost}, ${productVariants.cost}, 0.00)), 0.00)::numeric(15,2)::text`,
      })
      .from(stockLevels)
      .innerJoin(productVariants, eq(stockLevels.variantId, productVariants.id))
      .where(
        and(
          eq(stockLevels.tenantId, tenantId),
          isNull(stockLevels.deletedAt),
          isNull(productVariants.deletedAt),
        ),
      );

    return formatMoney(valuation[0]?.totalValue);
  }
}
