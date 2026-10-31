import { z } from 'zod';
import {
  NonNegativeMoneySchema,
  PercentSchema,
  PositiveQuantitySchema,
  TenantContextSchema,
} from '../common.schema';

export const WorkOrderStatusEnum = z.enum([
  'DRAFT',
  'RELEASED',
  'IN_PROGRESS',
  'QA_CHECK',
  'COMPLETED',
  'CANCELLED',
]);
export type WorkOrderStatus = z.infer<typeof WorkOrderStatusEnum>;

export const BomComponentSchema = z.object({
  rawMaterialProductId: z.string().uuid(),
  quantityRequiredPerUnit: PositiveQuantitySchema,
  scrapPercentage: PercentSchema.default('0.00'),
});

export type BomComponentInput = z.input<typeof BomComponentSchema>;
export type BomComponentDto = z.infer<typeof BomComponentSchema>;

export const CreateBomRequestSchema = z.object({
  finishedProductId: z.string().uuid(),
  bomCode: z.string().min(2),
  version: z.string().min(1).default('1.0'),
  laborCostPerUnit: NonNegativeMoneySchema.default('0.00'),
  overheadCostPerUnit: NonNegativeMoneySchema.default('0.00'),
  components: z.array(BomComponentSchema).min(1),
});

export type CreateBomRequestInput = z.input<typeof CreateBomRequestSchema>;
export type CreateBomRequest = z.infer<typeof CreateBomRequestSchema>;

export const CreateBomSchema = TenantContextSchema.merge(CreateBomRequestSchema);

export type CreateBomInput = z.input<typeof CreateBomSchema>;
export type CreateBomDto = z.infer<typeof CreateBomSchema>;

export const ReleaseWorkOrderRequestSchema = z.object({
  bomId: z.string().uuid(),
  finishedProductId: z.string().uuid(),
  plannedQty: PositiveQuantitySchema,
  sourceRawWarehouseId: z.string().uuid(),
  targetFinishedWarehouseId: z.string().uuid(),
  scheduledStartDate: z.string().datetime().optional(),
});

export type ReleaseWorkOrderRequestInput = z.input<typeof ReleaseWorkOrderRequestSchema>;
export type ReleaseWorkOrderRequest = z.infer<typeof ReleaseWorkOrderRequestSchema>;

export const ReleaseWorkOrderSchema = TenantContextSchema.merge(ReleaseWorkOrderRequestSchema);

export type ReleaseWorkOrderInput = z.input<typeof ReleaseWorkOrderSchema>;
export type ReleaseWorkOrderDto = z.infer<typeof ReleaseWorkOrderSchema>;

export const CompleteWorkOrderRequestSchema = z.object({
  workOrderId: z.string().uuid(),
  actualProducedQty: PositiveQuantitySchema,
  outputBatchNumber: z.string().min(1),
});

export type CompleteWorkOrderRequestInput = z.input<typeof CompleteWorkOrderRequestSchema>;
export type CompleteWorkOrderRequest = z.infer<typeof CompleteWorkOrderRequestSchema>;

export const CompleteWorkOrderSchema = TenantContextSchema.merge(CompleteWorkOrderRequestSchema);

export type CompleteWorkOrderInput = z.input<typeof CompleteWorkOrderSchema>;
export type CompleteWorkOrderDto = z.infer<typeof CompleteWorkOrderSchema>;

export const WorkOrderCompletedEventSchema = TenantContextSchema.extend({
  workOrderId: z.string().uuid(),
  workOrderNumber: z.string().min(1),
  bomId: z.string().uuid(),
  finishedProductId: z.string().uuid(),
  actualProducedQty: PositiveQuantitySchema,
  outputBatchNumber: z.string().min(1),
  rawMaterialCostTotal: NonNegativeMoneySchema,
  laborCostTotal: NonNegativeMoneySchema,
  overheadCostTotal: NonNegativeMoneySchema,
  totalProductionCost: NonNegativeMoneySchema,
  unitFinishedGoodCost: NonNegativeMoneySchema,
});

export type WorkOrderCompletedEventInput = z.input<typeof WorkOrderCompletedEventSchema>;
export type WorkOrderCompletedEvent = z.infer<typeof WorkOrderCompletedEventSchema>;

