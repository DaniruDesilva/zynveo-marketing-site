import { z } from 'zod';
import { MoneySchema, NonNegativeMoneySchema, TenantContextSchema } from '../common.schema';

export const AccountTypeEnum = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
export type AccountType = z.infer<typeof AccountTypeEnum>;

export const NormalBalanceEnum = z.enum(['DEBIT', 'CREDIT']);
export type NormalBalance = z.infer<typeof NormalBalanceEnum>;

export const JournalSourceModuleEnum = z.enum([
  'MANUAL',
  'SALES',
  'PROCUREMENT',
  'MANUFACTURING',
  'HR_PAYROLL',
]);
export type JournalSourceModule = z.infer<typeof JournalSourceModuleEnum>;

export const JournalStatusEnum = z.enum(['DRAFT', 'POSTED', 'REVERSED']);
export type JournalStatus = z.infer<typeof JournalStatusEnum>;

export const JournalLineDtoSchema = z.object({
  accountId: z.string().uuid(),
  accountCode: z.string().min(3),
  description: z.string().optional(),
  debit: NonNegativeMoneySchema.default('0.00'),
  credit: NonNegativeMoneySchema.default('0.00'),
});

export type JournalLineInput = z.input<typeof JournalLineDtoSchema>;
export type JournalLineDto = z.infer<typeof JournalLineDtoSchema>;

/**
 * HTTP request body schema for creating a manual journal entry at `apps/api-gateway`
 * (before `TenantContext` is injected by the gateway).
 */
export const PostJournalEntryRequestSchema = z.object({
  referenceNumber: z.string().min(1),
  sourceModule: JournalSourceModuleEnum.default('MANUAL'),
  sourceDocumentId: z.string().uuid().optional(),
  postingDate: z.string().datetime(),
  narration: z.string().min(3),
  lines: z.array(JournalLineDtoSchema).min(2),
});

export type PostJournalEntryRequestInput = z.input<typeof PostJournalEntryRequestSchema>;
export type PostJournalEntryRequest = z.infer<typeof PostJournalEntryRequestSchema>;

/**
 * Internal RPC payload for `finance.post_journal_entry` (includes gateway-injected `TenantContext`).
 */
export const PostJournalEntrySchema = TenantContextSchema.merge(PostJournalEntryRequestSchema);

export type PostJournalEntryInput = z.input<typeof PostJournalEntrySchema>;
export type PostJournalEntryDto = z.infer<typeof PostJournalEntrySchema>;

export const CheckCustomerCreditSchema = TenantContextSchema.extend({
  customerId: z.string().uuid(),
  additionalOrderAmount: NonNegativeMoneySchema,
});

export type CheckCustomerCreditInput = z.input<typeof CheckCustomerCreditSchema>;
export type CheckCustomerCreditDto = z.infer<typeof CheckCustomerCreditSchema>;

export const CheckCustomerCreditResponseSchema = z.object({
  approved: z.boolean(),
  creditLimit: MoneySchema,
  currentReceivableBalance: MoneySchema,
  availableCredit: MoneySchema,
  reason: z.string().optional(),
});

export type CheckCustomerCreditResponse = z.infer<typeof CheckCustomerCreditResponseSchema>;

export const GetTrialBalanceSchema = TenantContextSchema.extend({
  asOfDate: z.string().datetime().optional(),
});

export type GetTrialBalanceInput = z.input<typeof GetTrialBalanceSchema>;
export type GetTrialBalanceDto = z.infer<typeof GetTrialBalanceSchema>;

export const TrialBalanceRowSchema = z.object({
  accountId: z.string().uuid(),
  accountCode: z.string(),
  accountName: z.string(),
  accountType: AccountTypeEnum,
  normalBalance: NormalBalanceEnum,
  totalDebit: NonNegativeMoneySchema,
  totalCredit: NonNegativeMoneySchema,
  netBalance: MoneySchema,
});

export const TrialBalanceResponseSchema = z.object({
  isBalanced: z.boolean(),
  totalDebit: NonNegativeMoneySchema,
  totalCredit: NonNegativeMoneySchema,
  rows: z.array(TrialBalanceRowSchema),
});

export type TrialBalanceResponse = z.infer<typeof TrialBalanceResponseSchema>;

