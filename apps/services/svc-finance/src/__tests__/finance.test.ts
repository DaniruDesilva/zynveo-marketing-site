import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ERP_EVENT_PATTERNS } from '@zynveo/contracts';
import { InboxService, OutboxService } from '@zynveo/microservice-chassis';
import { FinanceController } from '../main';

describe('svc-finance Double-Entry Engine & Idempotent Sub-Ledger Consumer', () => {
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const CUSTOMER_ID = '33333333-3333-4333-8333-333333333333';
  const INVOICE_ID = '44444444-4444-4444-8444-444444444444';
  const ACCT_AR = '55555555-5555-4555-8555-555555555551';
  const ACCT_REV = '55555555-5555-4555-8555-555555555552';

  function createInMemoryFinanceDb() {
    const accounts: any[] = [];
    const journalEntries: any[] = [];
    const journalLines: any[] = [];
    const accountsReceivable: any[] = [];
    const outboxEvents: any[] = [];
    const processedEvents = new Set<string>();

    const tx: any = {
      select: () => ({
        from: (table: any) => ({
          where: async () => {
            const name = table?.[Symbol.for('drizzle:Name')];
            if (name === 'accounts') return accounts;
            if (name === 'journal_lines') return journalLines;
            if (name === 'accounts_receivable') return accountsReceivable;
            if (name === 'processed_events') {
              return Array.from(processedEvents).map((id) => ({ eventId: id }));
            }
            return [];
          },
        }),
      }),
      insert: (table: any) => ({
        values: (val: any) => {
          const name = table?.[Symbol.for('drizzle:Name')];
          const rows = Array.isArray(val) ? val : [val];
          const inserted = rows.map((r, i) => ({
            id: r.id || `00000000-0000-4000-8000-${String(100000000000 + accounts.length + journalEntries.length + journalLines.length + i).slice(-12)}`,
            ...r,
          }));

          if (name === 'accounts') accounts.push(...inserted);
          if (name === 'journal_entries') journalEntries.push(...inserted);
          if (name === 'journal_lines') journalLines.push(...inserted);
          if (name === 'accounts_receivable') accountsReceivable.push(...inserted);
          if (name === 'outbox_events') outboxEvents.push(...inserted);

          return {
            returning: async () => inserted,
            onConflictDoNothing: () => ({
              returning: async () => {
                const first = inserted[0];
                const key = `${first.tenantId}:${first.eventId}`;
                if (processedEvents.has(key)) {
                  return [];
                }
                processedEvents.add(key);
                return inserted;
              },
            }),
          };
        },
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => cb(tx),
    };

    return {
      db: tx,
      state: { accounts, journalEntries, journalLines, accountsReceivable, outboxEvents },
    };
  }

  it('rejects unbalanced journal entries and posts balanced double-entry journals with outbox emission', async () => {
    const { db, state } = createInMemoryFinanceDb();
    const controller = new FinanceController(db, new OutboxService(), new InboxService());

    // 1. Unbalanced journal entry must throw
    await assert.rejects(
      () =>
        controller.postJournalEntry({
          tenantId: TENANT_ID,
          actorUserId: USER_ID,
          correlationId: '66666666-6666-4666-8666-666666666666',
          referenceNumber: 'JE-UNBALANCED-01',
          sourceModule: 'MANUAL',
          postingDate: new Date().toISOString(),
          narration: 'Unbalanced test entry',
          lines: [
            { accountId: ACCT_AR, accountCode: '1100', debit: '100.00', credit: '0.00' },
            { accountId: ACCT_REV, accountCode: '4000', debit: '0.00', credit: '99.99' },
          ],
        }),
      /Unbalanced journal entry: Debits \(100\.00\) do not equal Credits \(99\.99\)/,
    );

    assert.equal(state.journalEntries.length, 0);

    // 2. Balanced journal entry commits and writes JOURNAL_POSTED to finance.outbox_events
    const res = await controller.postJournalEntry({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '66666666-6666-4666-8666-666666666666',
      referenceNumber: 'JE-BALANCED-01',
      sourceModule: 'MANUAL',
      postingDate: new Date().toISOString(),
      narration: 'Balanced test entry',
      lines: [
        { accountId: ACCT_AR, accountCode: '1100', debit: '2500.50', credit: '0.00' },
        { accountId: ACCT_REV, accountCode: '4000', debit: '0.00', credit: '2500.50' },
      ],
    });

    assert.equal(res.status, 'POSTED');
    assert.equal(res.totalDebit, '2500.50');
    assert.equal(res.totalCredit, '2500.50');
    assert.equal(state.journalEntries.length, 1);
    assert.equal(state.journalLines.length, 2);
    assert.equal(state.outboxEvents.length, 1);
    assert.equal(state.outboxEvents[0].eventName, ERP_EVENT_PATTERNS.JOURNAL_POSTED);
  });

  it('idempotently consumes INVOICE_FINALIZED and posts 5-line Sales + Tax + COGS journal once', async () => {
    const { db, state } = createInMemoryFinanceDb();
    const controller = new FinanceController(db, new OutboxService(), new InboxService());

    const envelope = {
      eventId: '77777777-7777-4777-8777-777777777777',
      eventName: ERP_EVENT_PATTERNS.INVOICE_FINALIZED,
      sourceService: 'svc-crm-sales',
      aggregateType: 'INVOICE',
      aggregateId: INVOICE_ID,
      tenantId: TENANT_ID,
      correlationId: '88888888-8888-4888-8888-888888888888',
      occurredAt: new Date().toISOString(),
      payload: {
        tenantId: TENANT_ID,
        actorUserId: USER_ID,
        correlationId: '88888888-8888-4888-8888-888888888888',
        invoiceId: INVOICE_ID,
        invoiceNumber: 'INV-1001',
        customerId: CUSTOMER_ID,
        currency: 'LKR',
        netRevenueAmount: '10000.00',
        totalDiscountAmount: '0.00',
        totalTaxAmount: '1800.00',
        grossReceivableAmount: '11800.00',
        totalCogsAmount: '4500.00',
      },
    };

    const first = await controller.handleInvoiceFinalized(envelope);
    const second = await controller.handleInvoiceFinalized(envelope);

    assert.equal(first.duplicate, false);
    assert.equal(second.duplicate, true, 'Duplicate BullMQ delivery must be skipped by processed_events');
    assert.equal(state.journalEntries.length, 1, 'Must create exactly 1 journal entry');
    assert.equal(state.journalLines.length, 5, 'Must create 5 lines: AR, Revenue, Tax, COGS, Inventory');
    assert.equal(state.accountsReceivable.length, 1, 'Must create 1 open Accounts Receivable record');
    assert.equal(state.accountsReceivable[0].balanceAmount, '11800.00');

    // Verify trial balance is 100% balanced (11800 + 4500 = 16300.00)
    const tb = await controller.getTrialBalance({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '88888888-8888-4888-8888-888888888888',
    });
    assert.equal(tb.isBalanced, true);
    assert.equal(tb.totalDebit, '16300.00');
    assert.equal(tb.totalCredit, '16300.00');
  });
});
