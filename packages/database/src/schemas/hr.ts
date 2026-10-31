import { pgSchema, uuid, timestamp, varchar, boolean, integer, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenantAuditColumns, moneyColumn, quantityColumn } from '../shared/columns';
import { createOutboxEventsTable, createProcessedEventsTable } from '../shared/outbox';

export const hrSchema = pgSchema('hr');

export const payrollRunStatusEnum = hrSchema.enum('payroll_run_status', [
  'DRAFT',
  'PROCESSING',
  'DISBURSED',
  'VOIDED',
]);

export const leaveStatusEnum = hrSchema.enum('leave_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export const departments = hrSchema.table('departments', {
  ...tenantAuditColumns(),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const designations = hrSchema.table('designations', {
  ...tenantAuditColumns(),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  grade: varchar('grade', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
});

export const employees = hrSchema.table('employees', {
  ...tenantAuditColumns(),
  employeeNumber: varchar('employee_number', { length: 50 }).notNull(),
  userId: uuid('user_id'), // Logical UUID reference to iam.users
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'restrict' }),
  designationId: uuid('designation_id').references(() => designations.id, { onDelete: 'restrict' }),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  epfNumber: varchar('epf_number', { length: 50 }),
  nicNumber: varchar('nic_number', { length: 50 }),
  bankName: varchar('bank_name', { length: 120 }),
  bankAccountNumber: varchar('bank_account_number', { length: 80 }),
  joinedDate: timestamp('joined_date').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const salaryStructures = hrSchema.table('salary_structures', {
  ...tenantAuditColumns(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'restrict' }),
  basicSalary: moneyColumn('basic_salary').notNull(),
  fixedAllowances: moneyColumn('fixed_allowances').default('0.00').notNull(),
  overtimeHourlyRate: moneyColumn('overtime_hourly_rate').default('0.00').notNull(),
  effectiveFrom: timestamp('effective_from').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const attendanceLogs = hrSchema.table('attendance_logs', {
  ...tenantAuditColumns(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'restrict' }),
  workDate: timestamp('work_date').notNull(),
  checkInAt: timestamp('check_in_at'),
  checkOutAt: timestamp('check_out_at'),
  regularHours: quantityColumn('regular_hours').default('8.0000').notNull(),
  overtimeHours: quantityColumn('overtime_hours').default('0.0000').notNull(),
  status: varchar('status', { length: 30 }).default('PRESENT').notNull(), // PRESENT | ABSENT | HALF_DAY | LEAVE
});

export const leaveRequests = hrSchema.table('leave_requests', {
  ...tenantAuditColumns(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'restrict' }),
  leaveType: varchar('leave_type', { length: 50 }).notNull(), // ANNUAL | CASUAL | MEDICAL | NO_PAY
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  totalDays: quantityColumn('total_days').notNull(),
  reason: text('reason'),
  status: leaveStatusEnum('status').default('PENDING').notNull(),
  approvedByUserId: uuid('approved_by_user_id'),
});

export const payrollRuns = hrSchema.table('payroll_runs', {
  ...tenantAuditColumns(),
  runNumber: varchar('run_number', { length: 50 }).notNull(),
  periodMonth: integer('period_month').notNull(),
  periodYear: integer('period_year').notNull(),
  status: payrollRunStatusEnum('status').default('DRAFT').notNull(),
  totalGrossSalary: moneyColumn('total_gross_salary').default('0.00').notNull(),
  totalEmployeeEpf8: moneyColumn('total_employee_epf_8').default('0.00').notNull(),
  totalEmployerEpf12: moneyColumn('total_employer_epf_12').default('0.00').notNull(),
  totalEmployerEtf3: moneyColumn('total_employer_etf_3').default('0.00').notNull(),
  totalApitTax: moneyColumn('total_apit_tax').default('0.00').notNull(),
  totalNetPayable: moneyColumn('total_net_payable').default('0.00').notNull(),
  disbursedAt: timestamp('disbursed_at'),
  disbursedByUserId: uuid('disbursed_by_user_id'),
});

export const payslipItems = hrSchema.table('payslip_items', {
  ...tenantAuditColumns(),
  payrollRunId: uuid('payroll_run_id')
    .notNull()
    .references(() => payrollRuns.id, { onDelete: 'restrict' }),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => employees.id, { onDelete: 'restrict' }),
  basicSalary: moneyColumn('basic_salary').notNull(),
  allowances: moneyColumn('allowances').default('0.00').notNull(),
  overtimePay: moneyColumn('overtime_pay').default('0.00').notNull(),
  grossSalary: moneyColumn('gross_salary').notNull(),
  employeeEpf8: moneyColumn('employee_epf_8').notNull(),
  employerEpf12: moneyColumn('employer_epf_12').notNull(),
  employerEtf3: moneyColumn('employer_etf_3').notNull(),
  apitTax: moneyColumn('apit_tax').default('0.00').notNull(),
  otherDeductions: moneyColumn('other_deductions').default('0.00').notNull(),
  netSalary: moneyColumn('net_salary').notNull(),
  pdfS3Key: varchar('pdf_s3_key', { length: 500 }),
});

export const hrOutboxEvents = createOutboxEventsTable(hrSchema);
export const hrProcessedEvents = createProcessedEventsTable(hrSchema);

export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  designation: one(designations, {
    fields: [employees.designationId],
    references: [designations.id],
  }),
  salaryStructures: many(salaryStructures),
  payslips: many(payslipItems),
}));

export const payrollRunsRelations = relations(payrollRuns, ({ many }) => ({
  payslipItems: many(payslipItems),
}));

export const payslipItemsRelations = relations(payslipItems, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payslipItems.payrollRunId],
    references: [payrollRuns.id],
  }),
  employee: one(employees, {
    fields: [payslipItems.employeeId],
    references: [employees.id],
  }),
}));

