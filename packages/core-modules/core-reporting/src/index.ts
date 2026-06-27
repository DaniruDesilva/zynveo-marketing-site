import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { 
  documents, 
  documentLines, 
  journalEntries, 
  journalLines, 
  accounts,
  stockLevels,
  productVariants
} from '@erp/database';

export class ReportingService {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Generates a Sales Summary Report within a given date range.
   */
  async getSalesSummary(tenantId: string, startDate: Date, endDate: Date) {
    const results = await this.db
      .select({
        date: sql<Date>`date_trunc('day', ${documents.date})`,
        totalRevenue: sql<number>`sum(${documents.total})`.mapWith(Number),
        totalTax: sql<number>`sum(${documents.taxTotal})`.mapWith(Number),
        invoiceCount: sql<number>`count(${documents.id})`.mapWith(Number),
      })
      .from(documents)
      .where(
        and(
          eq(documents.tenantId, tenantId),
          eq(documents.type, 'invoice'),
          eq(documents.status, 'sent'), // Count finalized sales
          gte(documents.date, startDate),
          lte(documents.date, endDate)
        )
      )
      .groupBy(sql`date_trunc('day', ${documents.date})`)
      .orderBy(sql`date_trunc('day', ${documents.date})`);

    return results;
  }

  /**
   * Real-Time Ledger Auditing: Finds any journal entries where Debits do not equal Credits.
   */
  async auditLedgerIntegrity(tenantId: string) {
    const unbalancedEntries = await this.db
      .select({
        journalEntryId: journalLines.journalEntryId,
        totalDebit: sql<number>`sum(${journalLines.debit})`.mapWith(Number),
        totalCredit: sql<number>`sum(${journalLines.credit})`.mapWith(Number),
        difference: sql<number>`abs(sum(${journalLines.debit}) - sum(${journalLines.credit}))`.mapWith(Number),
      })
      .from(journalLines)
      .where(eq(journalLines.tenantId, tenantId))
      .groupBy(journalLines.journalEntryId)
      .having(sql`sum(${journalLines.debit}) != sum(${journalLines.credit})`);

    return {
      isHealthy: unbalancedEntries.length === 0,
      unbalancedEntries
    };
  }

  /**
   * Generates a simple Profit & Loss summary.
   */
  async getProfitAndLoss(tenantId: string, startDate: Date, endDate: Date) {
    // Join Accounts with Journal Lines to sum Revenue and Expense types
    const pnl = await this.db
      .select({
        accountType: accounts.type,
        totalAmount: sql<number>`sum(${journalLines.credit} - ${journalLines.debit})`.mapWith(Number), // For Revenue, Credit increases. For Expense, Debit increases.
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .innerJoin(journalEntries, eq(journalLines.journalEntryId, journalEntries.id))
      .where(
        and(
          eq(journalLines.tenantId, tenantId),
          gte(journalEntries.date, startDate),
          lte(journalEntries.date, endDate)
        )
      )
      .groupBy(accounts.type);

    let revenue = 0;
    let expenses = 0;

    for (const row of pnl) {
      if (row.accountType === 'revenue') {
        revenue += row.totalAmount; // Credits are positive
      } else if (row.accountType === 'expense') {
        expenses -= row.totalAmount; // Debits are negative in this formula, subtract to make expenses positive
      }
    }

    return {
      revenue,
      expenses,
      netProfit: revenue - expenses
    };
  }

  /**
   * Real-Time Inventory Valuation (Simple Weighted Average approximation)
   */
  async getInventoryValuation(tenantId: string) {
    const valuation = await this.db
      .select({
        totalValue: sql<number>`sum(${stockLevels.quantity} * ${productVariants.cost})`.mapWith(Number)
      })
      .from(stockLevels)
      .innerJoin(productVariants, eq(stockLevels.variantId, productVariants.id))
      .where(eq(stockLevels.tenantId, tenantId));

    return valuation[0]?.totalValue || 0;
  }
}
