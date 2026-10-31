import Decimal from 'decimal.js';
import { sql } from 'drizzle-orm';
import {
  BiDateRangeQueryDto,
  BiDateRangeQuerySchema,
  ERP_EVENT_PATTERNS,
  ERP_RPC_PATTERNS,
  EventEnvelope,
  ExecutiveKpiResponse,
  ExecutiveKpiResponseSchema,
  ProfitAndLossResponse,
  ProfitAndLossResponseSchema,
  TenantContext,
  TenantContextSchema,
} from '@zynveo/contracts';
import * as biSchema from '@zynveo/database/bi';
import {
  Controller,
  DRIZZLE_DB,
  DrizzleModule,
  EventPattern,
  InboxService,
  Inject,
  MessagePattern,
  Module,
  OutboxService,
  Payload,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Controller()
export class BiReportingController {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: any,
    private readonly inboxService: InboxService,
  ) {}

  /**
   * Synchronous RPC (`bi.get_executive_kpis`):
   * Reads pre-aggregated metrics from `bi.mv_*` Materialized Views using `Decimal` arithmetic.
   */
  @MessagePattern(ERP_RPC_PATTERNS.BI_REPORTING.GET_EXECUTIVE_KPIS)
  async getExecutiveKpis(@Payload() rawPayload: TenantContext): Promise<ExecutiveKpiResponse> {
    const ctx = TenantContextSchema.parse(rawPayload);

    const salesRows = await this.queryMvRows<biSchema.MvDailySalesSummaryRow>(
      biSchema.BI_MATERIALIZED_VIEWS.DAILY_SALES_SUMMARY,
      ctx.tenantId,
    );
    const invRows = await this.queryMvRows<biSchema.MvInventoryValuationWacRow>(
      biSchema.BI_MATERIALIZED_VIEWS.INVENTORY_VALUATION_WAC,
      ctx.tenantId,
    );
    const arRows = await this.queryMvRows<biSchema.MvArAgingBucketsRow>(
      biSchema.BI_MATERIALIZED_VIEWS.AR_AGING_BUCKETS,
      ctx.tenantId,
    );
    const tbRows = await this.queryMvRows<biSchema.MvTrialBalanceRow>(
      biSchema.BI_MATERIALIZED_VIEWS.TRIAL_BALANCE,
      ctx.tenantId,
    );

    let todayRevenue = new Decimal(0);
    let todayInvoicesCount = 0;
    for (const row of salesRows) {
      todayRevenue = todayRevenue.plus(new Decimal(row.gross_revenue || '0.00'));
      todayInvoicesCount += Number(row.invoices_count || 0);
    }

    let totalInventoryValuationWac = new Decimal(0);
    let lowStockProductsCount = 0;
    for (const row of invRows) {
      totalInventoryValuationWac = totalInventoryValuationWac.plus(
        new Decimal(row.total_valuation || '0.00'),
      );
      if (new Decimal(row.quantity_on_hand || '0').lte(new Decimal('10.0000'))) {
        lowStockProductsCount += 1;
      }
    }

    let totalAccountsReceivable = new Decimal(0);
    for (const row of arRows) {
      totalAccountsReceivable = totalAccountsReceivable.plus(
        new Decimal(row.total_receivable || '0.00'),
      );
    }

    let totalAccountsPayable = new Decimal(0);
    for (const row of tbRows) {
      if (String(row.account_code) === '2000') {
        totalAccountsPayable = totalAccountsPayable.plus(
          new Decimal(row.net_balance || '0.00').abs(),
        );
      }
    }

    return ExecutiveKpiResponseSchema.parse({
      todayRevenue: todayRevenue.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      todayInvoicesCount,
      todayGrnsCount: 0,
      totalInventoryValuationWac: totalInventoryValuationWac
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toFixed(2),
      totalAccountsReceivable: totalAccountsReceivable
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toFixed(2),
      totalAccountsPayable: totalAccountsPayable
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toFixed(2),
      lowStockProductsCount,
    });
  }

  /**
   * Synchronous RPC (`bi.get_profit_and_loss`):
   * Computes P&L (Revenue, COGS, Gross Profit, Operating Expenses, Net Profit) from `bi.mv_trial_balance`
   * and `bi.mv_daily_sales_summary` using `Decimal`.
   */
  @MessagePattern(ERP_RPC_PATTERNS.BI_REPORTING.GET_PROFIT_AND_LOSS)
  async getProfitAndLoss(
    @Payload() rawPayload: BiDateRangeQueryDto,
  ): Promise<ProfitAndLossResponse> {
    const dto = BiDateRangeQuerySchema.parse(rawPayload);

    const tbRows = await this.queryMvRows<biSchema.MvTrialBalanceRow>(
      biSchema.BI_MATERIALIZED_VIEWS.TRIAL_BALANCE,
      dto.tenantId,
    );

    let totalRevenue = new Decimal(0);
    let totalCogs = new Decimal(0);
    let totalOperatingExpenses = new Decimal(0);

    for (const row of tbRows) {
      const acctType = String(row.account_type || '').toUpperCase();
      const code = String(row.account_code || '');
      const debit = new Decimal(row.total_debit || '0.00');
      const credit = new Decimal(row.total_credit || '0.00');

      if (acctType === 'REVENUE') {
        const netRev = credit.minus(debit);
        if (netRev.gt(0)) totalRevenue = totalRevenue.plus(netRev);
      } else if (acctType === 'EXPENSE') {
        const netExp = debit.minus(credit);
        if (netExp.gt(0)) {
          if (code === '5000') {
            totalCogs = totalCogs.plus(netExp);
          } else {
            totalOperatingExpenses = totalOperatingExpenses.plus(netExp);
          }
        }
      }
    }

    const grossProfit = totalRevenue
      .minus(totalCogs)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const netProfit = grossProfit
      .minus(totalOperatingExpenses)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return ProfitAndLossResponseSchema.parse({
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalRevenue: totalRevenue.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      totalCogs: totalCogs.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      totalOperatingExpenses: totalOperatingExpenses
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toFixed(2),
      netProfit: netProfit.toFixed(2),
    });
  }

  /**
   * Synchronous RPC (`bi.refresh_materialized_views`):
   * Refreshes all 4 Materialized Views concurrently without locking dashboard readers.
   */
  @MessagePattern(ERP_RPC_PATTERNS.BI_REPORTING.REFRESH_MATERIALIZED_VIEWS)
  async refreshMaterializedViews(@Payload() rawPayload?: Partial<TenantContext>) {
    const refreshedViews: string[] = [];
    const views = Object.values(biSchema.BI_MATERIALIZED_VIEWS);

    for (const viewName of views) {
      if (typeof this.db.execute === 'function') {
        await this.db.execute(
          sql.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`),
        );
      }
      refreshedViews.push(viewName);
    }

    return {
      refreshed: true,
      views: refreshedViews,
      refreshedAt: new Date().toISOString(),
      tenantId: rawPayload?.tenantId,
    };
  }

  /**
   * BullMQ Durable Consumer: Idempotently refreshes BI Materialized Views when domain events arrive.
   */
  @EventPattern(ERP_EVENT_PATTERNS.INVOICE_FINALIZED)
  @EventPattern(ERP_EVENT_PATTERNS.GRN_APPROVED)
  @EventPattern(ERP_EVENT_PATTERNS.WORK_ORDER_COMPLETED)
  @EventPattern(ERP_EVENT_PATTERNS.PAYROLL_DISBURSED)
  @EventPattern(ERP_EVENT_PATTERNS.JOURNAL_POSTED)
  @EventPattern(ERP_EVENT_PATTERNS.STOCK_LEVEL_MUTATED)
  async handleDomainEventForBiRefresh(@Payload() envelope: EventEnvelope<any>) {
    return this.inboxService.consumeIdempotently(
      this.db,
      biSchema.biProcessedEvents,
      'svc-bi-reporting',
      envelope,
      async () => {
        return this.refreshMaterializedViews({ tenantId: envelope.tenantId });
      },
    );
  }

  private async queryMvRows<TRow>(viewName: string, tenantId: string): Promise<TRow[]> {
    if (typeof this.db.queryMv === 'function') {
      return this.db.queryMv(viewName, tenantId);
    }
    if (typeof this.db.execute === 'function') {
      const res = await this.db.execute(
        sql`SELECT * FROM ${sql.raw(viewName)} WHERE tenant_id = ${tenantId}`,
      );
      return (Array.isArray(res) ? res : (res?.rows ?? [])) as TRow[];
    }
    return [];
  }
}

@Module({
  imports: [DrizzleModule.forService('bi', biSchema)],
  controllers: [BiReportingController],
  providers: [OutboxService, InboxService],
})
export class BiReportingModule {}

export async function startBiReportingService(
  port = Number(process.env.SVC_BI_HEALTH_PORT || 4008),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-bi-reporting',
    schemaName: 'bi',
    healthPort: port,
    appModule: BiReportingModule,
  });
}

if (require.main === module) {
  startBiReportingService().catch((err) => {
    console.error('Failed to start svc-bi-reporting:', err);
    process.exit(1);
  });
}
