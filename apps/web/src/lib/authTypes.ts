import { UserRole, Permission, DEFAULT_ROLE_PERMISSIONS, getPermissionsForRoles } from '@zynveo/contracts';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  roles: UserRole[];
  tenantId: string;
  tenantName: string;
  branchId: string;
  branchName: string;
  permissions: string[];
  token: string;
  expiresAt: number;
  avatarColor: string;
  jobTitle: string;
  department: string;
}

export interface DemoPersona {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  jobTitle: string;
  department: string;
  avatarColor: string;
  badge: string;
  description: string;
}

export const DEMO_TENANT = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Zynveo Enterprise Holdings Ltd',
  colomboBranchId: '33333333-3333-4333-8333-333333333333',
  colomboBranchName: 'Colombo HQ',
  kandyBranchId: '44444444-4444-4444-8444-444444444444',
  kandyBranchName: 'Kandy Distribution Hub',
};

export const DEMO_PERSONAS: Record<UserRole, DemoPersona> = {
  OWNER: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'owner@zynveo.com',
    fullName: 'Alexander Wright',
    role: 'OWNER',
    jobTitle: 'Executive Director & Founder',
    department: 'Executive Board',
    avatarColor: 'bg-blue-600',
    badge: 'Full Access',
    description: 'Complete strategic, operational and financial governance over all 8 enterprise microservices.',
  },
  ACCOUNTANT: {
    id: '11111111-1111-4111-8111-222222222222',
    email: 'accountant@zynveo.com',
    fullName: 'Elena Rostova',
    role: 'ACCOUNTANT',
    jobTitle: 'Chief Financial Accountant',
    department: 'Finance & Treasury',
    avatarColor: 'bg-emerald-600',
    badge: 'GL & Financials',
    description: 'Double-entry general ledger, journal posting, Accounts Receivable/Payable, and statutory VAT.',
  },
  WAREHOUSE_MANAGER: {
    id: '11111111-1111-4111-8111-333333333333',
    email: 'warehouse@zynveo.com',
    fullName: 'Marcus Vance',
    role: 'WAREHOUSE_MANAGER',
    jobTitle: 'Warehouse & Logistics Director',
    department: 'Supply Chain Operations',
    avatarColor: 'bg-amber-600',
    badge: 'WMS & Stocks',
    description: 'Multi-warehouse stock control, WAC valuation, FEFO batch receipts, and GRN verification.',
  },
  SALES_REP: {
    id: '11111111-1111-4111-8111-444444444444',
    email: 'sales@zynveo.com',
    fullName: 'Sophia Chen',
    role: 'SALES_REP',
    jobTitle: 'Senior Commercial Lead',
    department: 'Sales & Client Relations',
    avatarColor: 'bg-indigo-600',
    badge: 'Sales & POS',
    description: 'Order-to-Cash pipeline, customer invoicing, POS terminal execution, and receivables collection.',
  },
  PROCUREMENT_OFFICER: {
    id: '11111111-1111-4111-8111-555555555555',
    email: 'procurement@zynveo.com',
    fullName: 'David Kim',
    role: 'PROCUREMENT_OFFICER',
    jobTitle: 'Procurement Specialist',
    department: 'Procurement & SCM',
    avatarColor: 'bg-teal-600',
    badge: 'PO & 3-Way Match',
    description: 'Purchase orders, vendor rate cards, and automated 3-way match reconciliation against GRN.',
  },
  PRODUCTION_MANAGER: {
    id: '11111111-1111-4111-8111-666666666666',
    email: 'production@zynveo.com',
    fullName: 'Liam O\'Connor',
    role: 'PRODUCTION_MANAGER',
    jobTitle: 'Manufacturing Plant Manager',
    department: 'Plant Operations & Assembly',
    avatarColor: 'bg-orange-600',
    badge: 'BOM & Plant',
    description: 'Multi-level BOM configuration, scrap backflushing, work order dispatch, and unit costing.',
  },
  HR_MANAGER: {
    id: '11111111-1111-4111-8111-777777777777',
    email: 'hr@zynveo.com',
    fullName: 'Nadia Silva',
    role: 'HR_MANAGER',
    jobTitle: 'Head of People & Payroll',
    department: 'Human Resources',
    avatarColor: 'bg-pink-600',
    badge: 'HR & EPF/ETF',
    description: 'Employee master data, statutory EPF (8%/12%), ETF (3%), and progressive APIT tax disbursement.',
  },
  ADMIN: {
    id: '11111111-1111-4111-8111-888888888888',
    email: 'admin@zynveo.com',
    fullName: 'Kasun Jayasuriya',
    role: 'ADMIN',
    jobTitle: 'Systems Security Administrator',
    department: 'Information Technology',
    avatarColor: 'bg-violet-600',
    badge: 'IAM & Security',
    description: 'Tenant administration, IAM user provisioning, security policies, and immutable audit logs.',
  },
  VIEWER: {
    id: '11111111-1111-4111-8111-999999999999',
    email: 'auditor@zynveo.com',
    fullName: 'Priya Fernando',
    role: 'VIEWER',
    jobTitle: 'External Financial Auditor',
    department: 'Audit & Compliance',
    avatarColor: 'bg-slate-600',
    badge: 'Read-Only Audit',
    description: 'Read-only inspection rights across financial reports, general ledger, and trial balance.',
  },
};
