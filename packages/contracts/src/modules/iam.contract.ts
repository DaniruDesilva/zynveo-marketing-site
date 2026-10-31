import { z } from 'zod';
import { TenantContextSchema } from '../common.schema';

export const UserRoleEnum = z.enum([
  'OWNER',
  'ADMIN',
  'ACCOUNTANT',
  'WAREHOUSE_MANAGER',
  'SALES_REP',
  'PROCUREMENT_OFFICER',
  'HR_MANAGER',
  'PRODUCTION_MANAGER',
  'VIEWER',
]);

export type UserRole = z.infer<typeof UserRoleEnum>;

export const ValidateTenantAccessSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
});

export type ValidateTenantAccessInput = z.input<typeof ValidateTenantAccessSchema>;
export type ValidateTenantAccessDto = z.infer<typeof ValidateTenantAccessSchema>;

export const ValidateTenantAccessResponseSchema = z.object({
  authorized: z.boolean(),
  tenantId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  roles: z.array(UserRoleEnum),
});

export type ValidateTenantAccessResponse = z.infer<typeof ValidateTenantAccessResponseSchema>;

export const LogAuditTrailSchema = TenantContextSchema.extend({
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type LogAuditTrailInput = z.input<typeof LogAuditTrailSchema>;
export type LogAuditTrailDto = z.infer<typeof LogAuditTrailSchema>;

