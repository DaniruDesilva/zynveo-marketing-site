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

export const PermissionEnum = z.enum([
  // Executive Dashboard & Analytics
  'bi.dashboard.view',
  'bi.reports.view',

  // Finance & Accounting
  'finance.accounts.view',
  'finance.accounts.manage',
  'finance.journal.view',
  'finance.journal.create',
  'finance.journal.post',
  'finance.payment.record',

  // Sales & CRM
  'sales.invoice.view',
  'sales.invoice.create',
  'sales.invoice.finalize',
  'sales.customer.manage',
  'crm.ticket.create',

  // Procurement & Logistics
  'procurement.po.view',
  'procurement.po.create',
  'procurement.grn.approve',

  // Inventory & WMS
  'inventory.stock.view',
  'inventory.product.manage',
  'inventory.stock.adjust',

  // Manufacturing & BOM
  'manufacturing.bom.view',
  'manufacturing.bom.manage',
  'manufacturing.work_order.complete',

  // HR & Payroll
  'hr.employee.view',
  'hr.payroll.view',
  'hr.payroll.execute',

  // System Administration & Security Governance
  'iam.users.view',
  'iam.users.manage',
  'settings.company.view',
  'settings.company.manage',
  'audit.log.view',
]);

export type Permission = z.infer<typeof PermissionEnum>;

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  OWNER: PermissionEnum.options,
  ADMIN: PermissionEnum.options.filter((p) => p !== 'finance.journal.post'),
  ACCOUNTANT: [
    'bi.dashboard.view',
    'bi.reports.view',
    'finance.accounts.view',
    'finance.accounts.manage',
    'finance.journal.view',
    'finance.journal.create',
    'finance.journal.post',
    'finance.payment.record',
    'sales.invoice.view',
    'sales.invoice.create',
    'sales.invoice.finalize',
    'procurement.po.view',
    'inventory.stock.view',
    'hr.payroll.view',
    'audit.log.view',
  ],
  WAREHOUSE_MANAGER: [
    'bi.dashboard.view',
    'procurement.po.view',
    'procurement.grn.approve',
    'inventory.stock.view',
    'inventory.product.manage',
    'inventory.stock.adjust',
    'manufacturing.bom.view',
    'manufacturing.work_order.complete',
  ],
  SALES_REP: [
    'bi.dashboard.view',
    'sales.invoice.view',
    'sales.invoice.create',
    'sales.invoice.finalize',
    'sales.customer.manage',
    'crm.ticket.create',
    'inventory.stock.view',
  ],
  PROCUREMENT_OFFICER: [
    'bi.dashboard.view',
    'procurement.po.view',
    'procurement.po.create',
    'procurement.grn.approve',
    'inventory.stock.view',
  ],
  HR_MANAGER: [
    'bi.dashboard.view',
    'hr.employee.view',
    'hr.payroll.view',
    'hr.payroll.execute',
    'audit.log.view',
  ],
  PRODUCTION_MANAGER: [
    'bi.dashboard.view',
    'manufacturing.bom.view',
    'manufacturing.bom.manage',
    'manufacturing.work_order.complete',
    'inventory.stock.view',
    'inventory.stock.adjust',
  ],
  VIEWER: [
    'bi.dashboard.view',
    'bi.reports.view',
    'inventory.stock.view',
    'procurement.po.view',
  ],
};

export function getPermissionsForRoles(roles: UserRole[]): Permission[] {
  const permSet = new Set<Permission>();
  for (const role of roles) {
    const list = DEFAULT_ROLE_PERMISSIONS[role] || [];
    for (const p of list) {
      permSet.add(p);
    }
  }
  return Array.from(permSet);
}

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
  permissions: z.array(z.string()).optional(),
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

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  roles: z.array(UserRoleEnum),
  permissions: z.array(z.string()),
  tenantId: z.string().uuid(),
  tenantName: z.string(),
  branchId: z.string().uuid().optional(),
  branchName: z.string().optional(),
  isActive: z.boolean(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const InviteUserRequestSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: UserRoleEnum,
  branchId: z.string().uuid().optional(),
});

export type InviteUserRequestInput = z.input<typeof InviteUserRequestSchema>;
export type InviteUserRequestDto = z.infer<typeof InviteUserRequestSchema>;
