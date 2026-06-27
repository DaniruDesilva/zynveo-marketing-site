import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { 
  accounts, 
  journalEntries, 
  journalLines 
} from '@erp/database';

export class AccountingService {
  constructor(private db: NodePgDatabase<any>) {}

  /**
   * Posts a double-entry journal ensuring debits equal credits.
   */
  async postJournalEntry(
    tenantId: string, 
    entryNumber: string,
    description: string,
    lines: Array<{ accountId: string; debit: number; credit: number; description?: string }>
  ) {
    const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);

    // Strict Double-Entry validation
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Unbalanced journal entry: Debits ($${totalDebit}) do not equal Credits ($${totalCredit})`);
    }

    return await this.db.transaction(async (tx: any) => {
      // 1. Create the Journal Entry header
      const [entry] = await tx.insert(journalEntries).values({
        tenantId,
        entryNumber,
        description,
        status: 'posted',
        date: new Date()
      }).returning();

      // 2. Insert all ledger lines
      const mappedLines = lines.map(line => ({
        tenantId,
        journalEntryId: entry.id,
        accountId: line.accountId,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
        description: line.description || ''
      }));

      await tx.insert(journalLines).values(mappedLines);

      return entry;
    });
  }

  /**
   * Create a new General Ledger Account
   */
  async createAccount(tenantId: string, data: { code: string; name: string; type: "asset" | "liability" | "equity" | "revenue" | "expense"; normalBalance: "debit" | "credit" }) {
    const [account] = await this.db.insert(accounts as any).values({
      tenantId,
      code: data.code,
      name: data.name,
      type: data.type,
      normalBalance: data.normalBalance
    }).returning();
    return account;
  }
}
