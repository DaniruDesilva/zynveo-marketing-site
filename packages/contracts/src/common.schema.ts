import { z } from 'zod';

/**
 * Monetary fixed-point decimal string (up to 2 decimal places).
 * Maps to Drizzle `numeric(15, 2)` in PostgreSQL.
 * Example valid values: "0", "0.00", "1250.50", "-45.25"
 */
export const MoneySchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, 'Must be a valid monetary decimal string with at most 2 decimal places (e.g. "1250.50")');

/**
 * Non-negative monetary decimal string (>= 0, up to 2 decimal places).
 */
export const NonNegativeMoneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be a non-negative monetary decimal string with at most 2 decimal places (e.g. "1250.50")');

/**
 * Unit quantity or BOM conversion ratio decimal string (up to 4 decimal places).
 * Maps to Drizzle `numeric(15, 4)` in PostgreSQL.
 * Example valid values: "1", "10.0000", "0.1250"
 */
export const QuantitySchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,4})?$/, 'Must be a valid fixed-point quantity string with at most 4 decimal places (e.g. "10.0000")');

/**
 * Strictly positive quantity decimal string (> 0, up to 4 decimal places).
 */
export const PositiveQuantitySchema = QuantitySchema.refine(
  (val) => Number(val) > 0,
  'Quantity must be strictly greater than zero',
);

/**
 * Non-negative quantity decimal string (>= 0, up to 4 decimal places).
 */
export const NonNegativeQuantitySchema = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/, 'Must be a non-negative quantity decimal string with at most 4 decimal places');

/**
 * Percentage decimal string between 0 and 100 (up to 2 decimal places).
 */
export const PercentSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid percentage string with at most 2 decimal places')
  .refine((val) => {
    const num = Number(val);
    return num >= 0 && num <= 100;
  }, 'Percentage must be between 0.00 and 100.00');

/**
 * Backwards-compatible alias for up-to-4-dp decimal strings.
 * Prefer `MoneySchema` (2 dp) for currency and `QuantitySchema` (4 dp) for quantities.
 */
export const DecimalStringSchema = QuantitySchema;

/**
 * Authoritative multi-tenant context injected exclusively by `apps/api-gateway`
 * from the verified JWT session. Never trust client-supplied tenantId/actorUserId.
 */
export const TenantContextSchema = z.object({
  tenantId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  actorUserId: z.string().uuid(),
  correlationId: z.string().uuid().optional(),
});

export type TenantContextInput = z.input<typeof TenantContextSchema>;
export type TenantContext = z.infer<typeof TenantContextSchema>;

/**
 * Standard cursor/offset pagination parameters.
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});

export type PaginationInput = z.input<typeof PaginationSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Standard durable domain event envelope persisted in `outbox_events`
 * and delivered at-least-once via BullMQ queues.
 * Consumers use `eventId` to record idempotency in `processed_events`.
 */
export const EventEnvelopeSchema = <TPayload extends z.ZodTypeAny>(payloadSchema: TPayload) =>
  z.object({
    eventId: z.string().uuid(),
    eventName: z.string().min(1),
    occurredAt: z.string().datetime(),
    tenantId: z.string().uuid(),
    actorUserId: z.string().uuid().optional(),
    correlationId: z.string().uuid().optional(),
    sourceService: z.string().min(1),
    payload: payloadSchema,
  });

export type EventEnvelope<TPayload = unknown> = {
  eventId: string;
  eventName: string;
  occurredAt: string;
  tenantId: string;
  actorUserId?: string;
  correlationId?: string;
  sourceService: string;
  payload: TPayload;
};

