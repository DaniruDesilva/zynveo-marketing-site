import { z } from 'zod';
import {
  NonNegativeMoneySchema,
  NonNegativeQuantitySchema,
  PositiveQuantitySchema,
  QuantitySchema,
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

export const CreateProductRequestSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  price: NonNegativeMoneySchema.default('0.00'),
  cost: NonNegativeMoneySchema.default('0.00'),
  reorderThreshold: NonNegativeQuantitySchema.default('10.0000'),
  initialStock: NonNegativeQuantitySchema.default('0.0000'),
  warehouseId: z.string().uuid().optional(),
});

export type CreateProductRequestInput = z.input<typeof CreateProductRequestSchema>;
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const CreateProductSchema = TenantContextSchema.merge(CreateProductRequestSchema);
export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export const UpdateProductRequestSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  price: NonNegativeMoneySchema.optional(),
  cost: NonNegativeMoneySchema.optional(),
  reorderThreshold: NonNegativeQuantitySchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProductRequestInput = z.input<typeof UpdateProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export const UpdateProductSchema = TenantContextSchema.merge(UpdateProductRequestSchema);
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

export const SoftDeleteProductSchema = TenantContextSchema.extend({
  productId: z.string().uuid(),
});

export type SoftDeleteProductDto = z.infer<typeof SoftDeleteProductSchema>;

export const AdjustStockRequestSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantityDelta: QuantitySchema.refine((v) => Number(v) !== 0, 'Adjustment delta cannot be zero'),
  unitCost: NonNegativeMoneySchema.optional(),
  notes: z.string().max(500).optional(),
});

export type AdjustStockRequestInput = z.input<typeof AdjustStockRequestSchema>;
export type AdjustStockRequest = z.infer<typeof AdjustStockRequestSchema>;

export const AdjustStockSchema = TenantContextSchema.merge(AdjustStockRequestSchema);
export type AdjustStockDto = z.infer<typeof AdjustStockSchema>;

