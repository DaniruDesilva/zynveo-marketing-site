import { z } from 'zod';
import { NonNegativeMoneySchema, TenantContextSchema } from '../common.schema';

export const PayrollRunStatusEnum = z.enum(['DRAFT', 'PROCESSING', 'DISBURSED', 'VOIDED']);
export type PayrollRunStatus = z.infer<typeof PayrollRunStatusEnum>;

export const ExecutePayrollRunRequestSchema = z.object({
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2024).max(2100),
  employeeIds: z.array(z.string().uuid()).min(1),
});

export type ExecutePayrollRunRequestInput = z.input<typeof ExecutePayrollRunRequestSchema>;
export type ExecutePayrollRunRequest = z.infer<typeof ExecutePayrollRunRequestSchema>;

export const ExecutePayrollRunSchema = TenantContextSchema.merge(ExecutePayrollRunRequestSchema);

export type ExecutePayrollRunInput = z.input<typeof ExecutePayrollRunSchema>;
export type ExecutePayrollRunDto = z.infer<typeof ExecutePayrollRunSchema>;

export const GeneratePayslipPdfSchema = TenantContextSchema.extend({
  payrollRunId: z.string().uuid(),
  employeeId: z.string().uuid(),
});

export type GeneratePayslipPdfInput = z.input<typeof GeneratePayslipPdfSchema>;
export type GeneratePayslipPdfDto = z.infer<typeof GeneratePayslipPdfSchema>;

export const PayrollDisbursedEventSchema = TenantContextSchema.extend({
  payrollRunId: z.string().uuid(),
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2024).max(2100),
  totalGrossSalary: NonNegativeMoneySchema,
  totalEmployeeEpf8: NonNegativeMoneySchema,     // 8% Employee EPF Deduction
  totalEmployerEpf12: NonNegativeMoneySchema,    // 12% Employer EPF Contribution
  totalEmployerEtf3: NonNegativeMoneySchema,     // 3% Employer ETF Contribution
  totalApitTax: NonNegativeMoneySchema,          // APIT / PAYE Tax Deduction
  totalNetPayable: NonNegativeMoneySchema,
});

export type PayrollDisbursedEventInput = z.input<typeof PayrollDisbursedEventSchema>;
export type PayrollDisbursedEvent = z.infer<typeof PayrollDisbursedEventSchema>;

