import { Permission, UserRole, getPermissionsForRoles } from '@zynveo/contracts';

export interface RoutePolicy {
  prefix: string;
  anyPermissions: Permission[];
  label: string;
}

/**
 * Longest-prefix-first RBAC route policy map shared between Next.js Edge middleware
 * (`src/middleware.ts`), `AppShell.tsx`, and `RouteGuard.tsx`.
 */
export const ROUTE_ACCESS_POLICIES: RoutePolicy[] = [
  { prefix: '/accounting/journals/new', anyPermissions: ['finance.journal.post'], label: 'Create Journal Entry' },
  { prefix: '/accounting/payments/new', anyPermissions: ['finance.payment.record'], label: 'Record Payment' },
  { prefix: '/accounting/reports', anyPermissions: ['bi.reports.view', 'finance.accounts.view'], label: 'Financial Statements' },
  { prefix: '/accounting/accounts', anyPermissions: ['finance.accounts.view'], label: 'Chart of Accounts' },
  { prefix: '/accounting/journals', anyPermissions: ['finance.journal.view'], label: 'General Ledger Journals' },
  { prefix: '/accounting', anyPermissions: ['finance.accounts.view', 'finance.journal.view'], label: 'Accounting & GL' },
  { prefix: '/sales/invoices/new', anyPermissions: ['sales.invoice.create'], label: 'Create Sales Invoice' },
  { prefix: '/sales', anyPermissions: ['sales.invoice.view'], label: 'Sales & Invoicing' },
  { prefix: '/purchases/grn/new', anyPermissions: ['procurement.grn.approve'], label: 'Approve Goods Receipt' },
  { prefix: '/purchases', anyPermissions: ['procurement.po.view'], label: 'Purchases & GRN' },
  { prefix: '/manufacturing', anyPermissions: ['manufacturing.bom.view', 'manufacturing.work_order.complete'], label: 'Manufacturing & BOM' },
  { prefix: '/inventory', anyPermissions: ['inventory.stock.view'], label: 'Inventory & WMS' },
  { prefix: '/products', anyPermissions: ['inventory.product.manage', 'inventory.stock.view'], label: 'Product Catalog' },
  { prefix: '/hr', anyPermissions: ['hr.employee.view', 'hr.payroll.view'], label: 'HR & Payroll' },
  { prefix: '/reports', anyPermissions: ['bi.reports.view'], label: 'Reports & BI' },
  { prefix: '/people/customers/new', anyPermissions: ['sales.customer.manage'], label: 'Add Customer' },
  { prefix: '/people', anyPermissions: ['sales.customer.manage', 'hr.employee.view'], label: 'People Directory' },
  { prefix: '/crm', anyPermissions: ['crm.ticket.create', 'sales.customer.manage'], label: 'CRM & Tickets' },
  { prefix: '/support', anyPermissions: ['crm.ticket.create'], label: 'Support Desk' },
  { prefix: '/appointments', anyPermissions: ['crm.ticket.create', 'sales.customer.manage'], label: 'Appointments' },
  { prefix: '/departments', anyPermissions: ['hr.employee.view', 'settings.company.view'], label: 'Departments' },
  { prefix: '/workflow', anyPermissions: ['iam.users.view', 'audit.log.view', 'settings.company.view'], label: 'Workflow Approvals' },
  { prefix: '/documents', anyPermissions: ['audit.log.view', 'finance.journal.view', 'sales.invoice.view'], label: 'Documents Archive' },
  { prefix: '/chat', anyPermissions: ['bi.dashboard.view'], label: 'Team Chat' },
  { prefix: '/sms', anyPermissions: ['crm.ticket.create', 'settings.company.manage'], label: 'SMS Gateway' },
  { prefix: '/settings', anyPermissions: ['settings.company.view', 'iam.users.view'], label: 'Security & Settings' },
  { prefix: '/dashboard', anyPermissions: ['bi.dashboard.view'], label: 'Executive Dashboard' },
];

export function getRoutePolicy(pathname: string): RoutePolicy | null {
  for (const policy of ROUTE_ACCESS_POLICIES) {
    if (pathname === policy.prefix || pathname.startsWith(`${policy.prefix}/`)) {
      return policy;
    }
  }
  return null;
}

export function canAccessRoute(
  pathname: string,
  roles: string[] = [],
  permissions: string[] = [],
): boolean {
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return true;
  }

  const policy = getRoutePolicy(pathname);
  if (!policy) {
    return true;
  }

  if (roles.includes('OWNER')) {
    return true;
  }

  const effectivePerms =
    permissions.length > 0
      ? permissions
      : getPermissionsForRoles(roles as UserRole[]);

  return policy.anyPermissions.some((perm) => effectivePerms.includes(perm));
}
