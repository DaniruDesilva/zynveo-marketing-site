import { z } from 'zod';
import {
  NonNegativeMoneySchema,
  PercentSchema,
  PositiveQuantitySchema,
  TenantContextSchema,
} from '../common.schema';

export const TicketSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type TicketSeverity = z.infer<typeof TicketSeverityEnum>;

export const TicketStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export type TicketStatus = z.infer<typeof TicketStatusEnum>;

export const InvoiceStatusEnum = z.enum(['DRAFT', 'FINALIZING', 'FINALIZED', 'PAID', 'VOIDED']);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const QuotationStatusEnum = z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'EXPIRED', 'CONVERTED']);
export type QuotationStatus = z.infer<typeof QuotationStatusEnum>;

export const SalesOrderStatusEnum = z.enum(['DRAFT', 'CONFIRMED', 'DISPATCHED', 'INVOICED', 'CANCELLED']);
export type SalesOrderStatus = z.infer<typeof SalesOrderStatusEnum>;

export const InvoiceLineSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1),
  description: z.string().optional(),
  quantity: PositiveQuantitySchema,
  unitPrice: NonNegativeMoneySchema,
  discountAmount: NonNegativeMoneySchema.default('0.00'),
  taxRatePercent: PercentSchema.default('0.00'),
});

export type InvoiceLineInput = z.input<typeof InvoiceLineSchema>;
export type InvoiceLineDto = z.infer<typeof InvoiceLineSchema>;

export const CreateDraftInvoiceRequestSchema = z.object({
  customerId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  currency: z.string().length(3).default('LKR'),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lines: z.array(InvoiceLineSchema).min(1),
});

export type CreateDraftInvoiceRequestInput = z.input<typeof CreateDraftInvoiceRequestSchema>;
export type CreateDraftInvoiceRequest = z.infer<typeof CreateDraftInvoiceRequestSchema>;

export const CreateDraftInvoiceSchema = TenantContextSchema.merge(CreateDraftInvoiceRequestSchema);

export type CreateDraftInvoiceInput = z.input<typeof CreateDraftInvoiceSchema>;
export type CreateDraftInvoiceDto = z.infer<typeof CreateDraftInvoiceSchema>;

/**
 * HTTP request body for finalizing an invoice (`POST /api/v1/sales/invoices/:invoiceId/finalize`).
 * Note: Line items and prices are NOT accepted from the client during finalization;
 * `svc-crm-sales` loads the authoritative draft invoice lines from `sales_crm.invoice_lines`.
 */
export const FinalizeInvoiceRequestSchema = z.object({
  warehouseId: z.string().uuid(),
});

export type FinalizeInvoiceRequestInput = z.input<typeof FinalizeInvoiceRequestSchema>;
export type FinalizeInvoiceRequest = z.infer<typeof FinalizeInvoiceRequestSchema>;

/**
 * Internal RPC payload for `sales.finalize_invoice`.
 */
export const FinalizeInvoiceSchema = TenantContextSchema.extend({
  invoiceId: z.string().uuid(),
  warehouseId: z.string().uuid(),
});

export type FinalizeInvoiceInput = z.input<typeof FinalizeInvoiceSchema>;
export type FinalizeInvoiceDto = z.infer<typeof FinalizeInvoiceSchema>;

/**
 * Emitted as `ERP_EVENT_PATTERNS.INVOICE_FINALIZED` after `svc-inventory-wms` confirms stock deduction.
 * Consumed by `svc-finance` to post the 4-line Double-Entry Journal (AR, Revenue, Tax, COGS/Inventory).
 */
export const InvoiceFinalizedEventSchema = TenantContextSchema.extend({
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  customerId: z.string().uuid(),
  currency: z.string().length(3).default('LKR'),
  netRevenueAmount: NonNegativeMoneySchema,
  totalDiscountAmount: NonNegativeMoneySchema.default('0.00'),
  totalTaxAmount: NonNegativeMoneySchema,
  grossReceivableAmount: NonNegativeMoneySchema,
  totalCogsAmount: NonNegativeMoneySchema, // Provided by Inventory WAC calculation
});

export type InvoiceFinalizedEventInput = z.input<typeof InvoiceFinalizedEventSchema>;
export type InvoiceFinalizedEvent = z.infer<typeof InvoiceFinalizedEventSchema>;

export const InvoiceStockFailedEventSchema = TenantContextSchema.extend({
  invoiceId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  reason: z.string().min(1),
});

export type InvoiceStockFailedEvent = z.infer<typeof InvoiceStockFailedEventSchema>;

export const ConvertQuoteToInvoiceSchema = TenantContextSchema.extend({
  quotationId: z.string().uuid(),
  warehouseId: z.string().uuid(),
});

export type ConvertQuoteToInvoiceInput = z.input<typeof ConvertQuoteToInvoiceSchema>;
export type ConvertQuoteToInvoiceDto = z.infer<typeof ConvertQuoteToInvoiceSchema>;

export const CreateSlaTicketRequestSchema = z.object({
  customerId: z.string().uuid(),
  subject: z.string().min(3),
  description: z.string().min(5),
  severity: TicketSeverityEnum.default('LOW'),
});

export type CreateSlaTicketRequestInput = z.input<typeof CreateSlaTicketRequestSchema>;
export type CreateSlaTicketRequest = z.infer<typeof CreateSlaTicketRequestSchema>;

export const CreateSlaTicketSchema = TenantContextSchema.merge(CreateSlaTicketRequestSchema);

export type CreateSlaTicketInput = z.input<typeof CreateSlaTicketSchema>;
export type CreateSlaTicketDto = z.infer<typeof CreateSlaTicketSchema>;

