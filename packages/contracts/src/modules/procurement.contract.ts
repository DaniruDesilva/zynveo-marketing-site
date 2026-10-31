import { z } from 'zod';
import {
  NonNegativeMoneySchema,
  NonNegativeQuantitySchema,
  PositiveQuantitySchema,
  TenantContextSchema,
} from '../common.schema';

export const PurchaseOrderStatusEnum = z.enum([
  'DRAFT',
  'ISSUED',
  'PARTIALLY_RECEIVED',
  'COMPLETED',
  'CANCELLED',
]);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusEnum>;

export const GrnStatusEnum = z.enum(['DRAFT', 'APPROVED', 'REJECTED']);
export type GrnStatus = z.infer<typeof GrnStatusEnum>;

export const PurchaseOrderLineDtoSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1),
  orderedQty: PositiveQuantitySchema,
  unitCost: NonNegativeMoneySchema,
});

export const CreatePurchaseOrderRequestSchema = z.object({
  supplierId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  lines: z.array(PurchaseOrderLineDtoSchema).min(1),
});

export type CreatePurchaseOrderRequestInput = z.input<typeof CreatePurchaseOrderRequestSchema>;
export type CreatePurchaseOrderRequest = z.infer<typeof CreatePurchaseOrderRequestSchema>;

export const CreatePurchaseOrderSchema = TenantContextSchema.merge(CreatePurchaseOrderRequestSchema);

export type CreatePurchaseOrderInput = z.input<typeof CreatePurchaseOrderSchema>;
export type CreatePurchaseOrderDto = z.infer<typeof CreatePurchaseOrderSchema>;

/**
 * Warehouse receipt input per line when submitting/approving a GRN.
 * Note: `orderedQty` and `unitCost` are NOT accepted from the client;
 * `svc-procurement` loads authoritative PO quantities and unit costs from `scm.po_lines`.
 */
export const GrnReceiptLineInputSchema = z.object({
  poLineId: z.string().uuid(),
  productId: z.string().uuid(),
  receivedQty: PositiveQuantitySchema,
  rejectedQty: NonNegativeQuantitySchema.default('0.0000'),
  batchNumber: z.string().min(1),
  expiryDate: z.string().datetime().optional(),
});

export type GrnReceiptLineInput = z.input<typeof GrnReceiptLineInputSchema>;
export type GrnReceiptLineDto = z.infer<typeof GrnReceiptLineInputSchema>;

export const ApproveGrnRequestSchema = z.object({
  grnId: z.string().uuid(),
  purchaseOrderId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  lines: z.array(GrnReceiptLineInputSchema).min(1),
});

export type ApproveGrnRequestInput = z.input<typeof ApproveGrnRequestSchema>;
export type ApproveGrnRequest = z.infer<typeof ApproveGrnRequestSchema>;

export const ApproveGrnSchema = TenantContextSchema.merge(ApproveGrnRequestSchema);

export type ApproveGrnInput = z.input<typeof ApproveGrnSchema>;
export type ApproveGrnDto = z.infer<typeof ApproveGrnSchema>;

/**
 * Authoritative GRN line payload emitted by `svc-procurement` after verifying against `scm.po_lines`.
 */
export const GrnVerifiedLineItemSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1),
  poLineId: z.string().uuid(),
  orderedQty: PositiveQuantitySchema,
  receivedQty: PositiveQuantitySchema,
  rejectedQty: NonNegativeQuantitySchema.default('0.0000'),
  unitCost: NonNegativeMoneySchema,
  lineTotalCost: NonNegativeMoneySchema,
  batchNumber: z.string().min(1),
  expiryDate: z.string().datetime().optional(),
});

export type GrnVerifiedLineItem = z.infer<typeof GrnVerifiedLineItemSchema>;

/**
 * Emitted as `ERP_EVENT_PATTERNS.GRN_APPROVED` -> Consumed by Inventory (Stock+ & WAC) & Finance (GRNI / AP Ledger).
 */
export const GrnApprovedEventSchema = TenantContextSchema.extend({
  grnId: z.string().uuid(),
  grnNumber: z.string().min(1),
  purchaseOrderId: z.string().uuid(),
  supplierId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  totalAcceptedCost: NonNegativeMoneySchema,
  lines: z.array(GrnVerifiedLineItemSchema).min(1),
});

export type GrnApprovedEventInput = z.input<typeof GrnApprovedEventSchema>;
export type GrnApprovedEvent = z.infer<typeof GrnApprovedEventSchema>;

export const VerifyThreeWayMatchSchema = TenantContextSchema.extend({
  purchaseOrderId: z.string().uuid(),
  grnId: z.string().uuid(),
  supplierBillId: z.string().uuid(),
});

export type VerifyThreeWayMatchInput = z.input<typeof VerifyThreeWayMatchSchema>;
export type VerifyThreeWayMatchDto = z.infer<typeof VerifyThreeWayMatchSchema>;

export const VerifyThreeWayMatchResponseSchema = z.object({
  isMatched: z.boolean(),
  poTotalAmount: NonNegativeMoneySchema,
  grnTotalAmount: NonNegativeMoneySchema,
  billTotalAmount: NonNegativeMoneySchema,
  discrepancies: z.array(
    z.object({
      productId: z.string().uuid(),
      poOrderedQty: PositiveQuantitySchema,
      grnAcceptedQty: NonNegativeQuantitySchema,
      poUnitCost: NonNegativeMoneySchema,
      billUnitCost: NonNegativeMoneySchema,
      reason: z.string(),
    }),
  ),
});

export type VerifyThreeWayMatchResponse = z.infer<typeof VerifyThreeWayMatchResponseSchema>;

