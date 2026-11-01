import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ERP_EVENT_PATTERNS } from '@zynveo/contracts';
import { BI_MATERIALIZED_VIEWS } from '@zynveo/database/bi';
import { InboxService } from '@zynveo/microservice-chassis';
import { BiReportingController } from '../main';

describe('svc-bi-reporting Materialized Views, Executive KPIs & P&L Verification', () => {
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';
  const USER_ID = '11111111-1111-4111-8111-111111111111';

  function createInMemoryBiDb() {
    const executedSql: string[] = [];
    const processedEvents = new Set<string>();

    const mvData: Record<string, any[]> = {
      [BI_MATERIALIZED_VIEWS.DAILY_SALES_SUMMARY]: [
        {
          tenant_id: TENANT_ID,
          sale_date: '2026-10-31',
          invoices_count: 3,
          net_revenue: '50000.00',
          total_tax: '9000.00',
          gross_revenue: '59000.00',
          total_cogs: '22000.00',
        },
      ],
      [BI_MATERIALIZED_VIEWS.INVENTORY_VALUATION_WAC]: [
        {
          tenant_id: TENANT_ID,
          warehouse_id: '33333333-3333-4333-8333-333333333333',
          variant_id: '44444444-4444-4444-8444-444444444441',
          sku: 'CEYLON-CINN-1KG',
          quantity_on_hand: '8.0000', // <= 10.0000 low stock
          unit_wac_cost: '125.00',
          total_valuation: '1000.00',
        },
        {
          tenant_id: TENANT_ID,
          warehouse_id: '33333333-3333-4333-8333-333333333333',
          variant_id: '44444444-4444-4444-8444-444444444442',
          sku: 'CEYLON-TEA-BOPF',
          quantity_on_hand: '50.0000',
          unit_wac_cost: '400.00',
          total_valuation: '20000.00',
        },
      ],
      [BI_MATERIALIZED_VIEWS.AR_AGING_BUCKETS]: [
        {
          tenant_id: TENANT_ID,
          customer_id: '55555555-5555-4555-8555-555555555555',
          bucket_current: '11800.00',
          bucket_1_30: '0.00',
          bucket_31_60: '0.00',
          bucket_61_90: '0.00',
          bucket_over_90: '0.00',
          total_receivable: '11800.00',
        },
      ],
      [BI_MATERIALIZED_VIEWS.TRIAL_BALANCE]: [
        {
          tenant_id: TENANT_ID,
          account_id: '66666666-6666-4666-8666-666666666661',
          account_code: '2000',
          account_name: 'Accounts Payable (GRNI)',
          account_type: 'LIABILITY',
          normal_balance: 'CREDIT',
          total_debit: '0.00',
          total_credit: '12000.00',
          net_balance: '12000.00',
        },
        {
          tenant_id: TENANT_ID,
          account_id: '66666666-6666-4666-8666-666666666662',
          account_code: '4000',
          account_name: 'Sales Revenue',
          account_type: 'REVENUE',
          normal_balance: 'CREDIT',
          total_debit: '0.00',
          total_credit: '50000.00',
          net_balance: '50000.00',
        },
        {
          tenant_id: TENANT_ID,
          account_id: '66666666-6666-4666-8666-666666666663',
          account_code: '5000',
          account_name: 'Cost of Goods Sold',
          account_type: 'EXPENSE',
          normal_balance: 'DEBIT',
          total_debit: '22000.00',
          total_credit: '0.00',
          net_balance: '22000.00',
        },
        {
          tenant_id: TENANT_ID,
          account_id: '66666666-6666-4666-8666-666666666664',
          account_code: '5200',
          account_name: 'Salaries & Wages Expense',
          account_type: 'EXPENSE',
          normal_balance: 'DEBIT',
          total_debit: '8000.00',
          total_credit: '0.00',
          net_balance: '8000.00',
        },
      ],
    };

    const db: any = {
      queryMv: async (viewName: string) => mvData[viewName] ?? [],
      execute: async (query: any) => {
        const text = query?.queryChunks?.[0]?.value?.[0] ?? String(query);
        executedSql.push(text);
        return [];
      },
      insert: () => ({
        values: (val: any) => {
          const rows = Array.isArray(val) ? val : [val];
          return {
            onConflictDoNothing: () => ({
              returning: async () => {
                const first = rows[0];
                const key = `${first.tenantId}:${first.eventId}`;
                if (processedEvents.has(key)) return [];
                processedEvents.add(key);
                return rows;
              },
            }),
          };
        },
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => cb(db),
    };

    return { db, executedSql };
  }

  it('computes Executive KPIs, Profit & Loss statement, and refreshes Materialized Views concurrently', async () => {
    const { db, executedSql } = createInMemoryBiDb();
    const controller = new BiReportingController(db, new InboxService());

    const kpis = await controller.getExecutiveKpis({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '77777777-7777-4777-8777-777777777771',
    });

    assert.equal(kpis.todayRevenue, '59000.00');
    assert.equal(kpis.todayInvoicesCount, 3);
    assert.equal(kpis.totalInventoryValuationWac, '21000.00');
    assert.equal(kpis.totalAccountsReceivable, '11800.00');
    assert.equal(kpis.totalAccountsPayable, '12000.00');
    assert.equal(kpis.lowStockProductsCount, 1);

    const pnl = await controller.getProfitAndLoss({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '77777777-7777-4777-8777-777777777772',
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-31T23:59:59.000Z',
    });

    assert.equal(pnl.totalRevenue, '50000.00');
    assert.equal(pnl.totalCogs, '22000.00');
    assert.equal(pnl.grossProfit, '28000.00');
    assert.equal(pnl.totalOperatingExpenses, '8000.00');
    assert.equal(pnl.netProfit, '20000.00');

    // Idempotent domain event triggers REFRESH MATERIALIZED VIEW CONCURRENTLY on all 4 views
    const envelope = {
      eventId: '88888888-8888-4888-8888-888888888881',
      eventName: ERP_EVENT_PATTERNS.JOURNAL_POSTED,
      sourceService: 'svc-finance',
      tenantId: TENANT_ID,
      occurredAt: new Date().toISOString(),
      payload: { journalEntryId: '99999999-9999-4999-8999-999999999999' },
    };

    const first = await controller.handleDomainEventForBiRefresh(envelope);
    const second = await controller.handleDomainEventForBiRefresh(envelope);
    assert.equal(first.duplicate, false);
    assert.equal(second.duplicate, true);
    assert.equal(executedSql.length, 4);
    assert.ok(executedSql[0].includes('REFRESH MATERIALIZED VIEW CONCURRENTLY bi.mv_daily_sales_summary'));
  });
});

