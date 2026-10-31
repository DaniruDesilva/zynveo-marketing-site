import { z } from 'zod';
import { MoneySchema, NonNegativeMoneySchema, TenantContextSchema } from '../common.schema';

export const BiDateRangeQuerySchema = TenantContextSchema.extend({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type BiDateRangeQueryInput = z.input<typeof BiDateRangeQuerySchema>;
export type BiDateRangeQueryDto = z.infer<typeof BiDateRangeQuerySchema>;

export const ExecutiveKpiResponseSchema = z.object({
  todayRevenue: NonNegativeMoneySchema,
  todayInvoicesCount: z.number().int().min(0),
  todayGrnsCount: z.number().int().min(0),
  totalInventoryValuationWac: NonNegativeMoneySchema,
  totalAccountsReceivable: NonNegativeMoneySchema,
  totalAccountsPayable: NonNegativeMoneySchema,
  lowStockProductsCount: z.number().int().min(0),
});

export type ExecutiveKpiResponse = z.infer<typeof ExecutiveKpiResponseSchema>;

export const ProfitAndLossResponseSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalRevenue: NonNegativeMoneySchema,
  totalCogs: NonNegativeMoneySchema,
  grossProfit: MoneySchema,
  totalOperatingExpenses: NonNegativeMoneySchema,
  netProfit: MoneySchema,
});

export type ProfitAndLossResponse = z.infer<typeof ProfitAndLossResponseSchema>;

