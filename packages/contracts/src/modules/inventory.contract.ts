import { z } from 'zod';
import {
  NonNegativeMoneySchema,
  NonNegativeQuantitySchema,
  PositiveQuantitySchema,
  TenantContextSchema,
} from '../common.schema';

export const StockMovementReasonEnum = z.enum([
  'GRN_RECEIPT',
  'SALES_DISPATCH',
  'PRODUCTION_RAW_CONSUME',
  'PRODUCTION_FG_YIELD',
  'WAREHOUSE_TRANSFER',
  'STOCK_ADJUSTMENT',
]);
export type StockMovementReason = z.infer<typeof StockMovementReasonEnum>;

export const AtomicStockMutationItemSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1),
  quantity: PositiveQuantitySchema,
  unitCost: NonNegativeMoneySchema.optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
});

export type AtomicStockMutationItemInput = z.input<typeof AtomicStockMutationItemSchema>;
export type AtomicStockMutationItem = z.infer<typeof AtomicStockMutationItemSchema>;

export const AtomicStockMutationSchema = TenantContextSchema.extend({
  warehouseId: z.string().uuid(),
  referenceDocumentId: z.string().uuid(),
  reason: StockMovementReasonEnum,
  items: z.array(AtomicStockMutationItemSchema).min(1),
});

export type AtomicStockMutationInput = z.input<typeof AtomicStockMutationSchema>;
export type AtomicStockMutationDto = z.infer<typeof AtomicStockMutationSchema>;

export const AtomicStockMutationResponseSchema = z.object({
  success: z.boolean(),
  totalCogsValuation: NonNegativeMoneySchema, // Calculated using Weighted Average Cost (WAC)
  updatedBalances: z.array(
    z.object({
      productId: z.string().uuid(),
      remainingQuantity: NonNegativeQuantitySchema,
      unitWacCost: NonNegativeMoneySchema,
    }),
  ),
});

export type AtomicStockMutationResponse = z.infer<typeof AtomicStockMutationResponseSchema>;

export const StockReservationSchema = TenantContextSchema.extend({
  warehouseId: z.string().uuid(),
  salesOrderId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      sku: z.string().min(1),
      quantity: PositiveQuantitySchema,
    }),
  ).min(1),
});

export type StockReservationInput = z.input<typeof StockReservationSchema>;
export type StockReservationDto = z.infer<typeof StockReservationSchema>;

export const LowStockThresholdBreachedEventSchema = TenantContextSchema.extend({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string().min(1),
  currentQuantity: NonNegativeQuantitySchema,
  reorderThreshold: NonNegativeQuantitySchema,
});

export type LowStockThresholdBreachedEvent = z.infer<typeof LowStockThresholdBreachedEventSchema>;

