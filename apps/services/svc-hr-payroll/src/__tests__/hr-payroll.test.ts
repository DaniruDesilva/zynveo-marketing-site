import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ERP_EVENT_PATTERNS } from '@zynveo/contracts';
import { InboxService, OutboxService } from '@zynveo/microservice-chassis';
import { HrPayrollController, calculateStatutoryPayslip } from '../main';

describe('svc-hr-payroll Statutory EPF/ETF/APIT Payroll Engine', () => {
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const EMP_1 = '33333333-3333-4333-8333-333333333331';
  const EMP_2 = '33333333-3333-4333-8333-333333333332';

  function createInMemoryHrDb() {
    const salaryStructures: any[] = [
      {
        id: '44444444-4444-4444-8444-444444444441',
        tenantId: TENANT_ID,
        employeeId: EMP_1,
        basicSalary: '150000.00',
        fixedAllowances: '25000.00',
        isActive: true,
      },
      {
        id: '44444444-4444-4444-8444-444444444442',
        tenantId: TENANT_ID,
        employeeId: EMP_2,
        basicSalary: '80000.00',
        fixedAllowances: '10000.00',
        isActive: true,
      },
    ];
    const payrollRuns: any[] = [];
    const payslipItems: any[] = [];
    const outboxEvents: any[] = [];

    const tx: any = {
      select: () => ({
        from: (table: any) => ({
          where: async () => {
            const name = table?.[Symbol.for('drizzle:Name')];
            if (name === 'salary_structures') return salaryStructures;
            if (name === 'payslip_items') return payslipItems;
            return [];
          },
        }),
      }),
      insert: (table: any) => ({
        values: (val: any) => {
          const name = table?.[Symbol.for('drizzle:Name')];
          const rows = Array.isArray(val) ? val : [val];
          const inserted = rows.map((r, i) => ({
            id:
              r.id ||
              `55555555-5555-4555-8555-${String(100000000000 + payrollRuns.length + payslipItems.length + i).slice(-12)}`,
            ...r,
          }));
          if (name === 'payroll_runs') payrollRuns.push(...inserted);
          if (name === 'payslip_items') payslipItems.push(...inserted);
          if (name === 'outbox_events') outboxEvents.push(...inserted);
          return {
            returning: async () => inserted,
          };
        },
      }),
      transaction: async (cb: (tx: any) => Promise<any>) => cb(tx),
    };

    return {
      db: tx,
      state: { salaryStructures, payrollRuns, payslipItems, outboxEvents },
    };
  }

  it('computes statutory EPF 8%, EPF 12%, ETF 3%, and progressive APIT tax and emits PAYROLL_DISBURSED', async () => {
    // Pure statutory check for Basic 150,000 + Allowance 25,000 = Gross 175,000:
    // Employee EPF 8% of 150,000 = 12,000.00
    // Employer EPF 12% of 150,000 = 18,000.00
    // Employer ETF 3% of 150,000 = 4,500.00
    // APIT on 175,000: first 100k @ 0%, next 41,666.67 @ 6% (2,500.00), remaining 33,333.33 @ 12% (4,000.00) = 6,500.00
    // Net Salary = 175,000 - 12,000 - 6,500 = 156,500.00
    const slip1 = calculateStatutoryPayslip({
      basicSalary: '150000.00',
      fixedAllowances: '25000.00',
    });
    assert.equal(slip1.grossSalary, '175000.00');
    assert.equal(slip1.employeeEpf8, '12000.00');
    assert.equal(slip1.employerEpf12, '18000.00');
    assert.equal(slip1.employerEtf3, '4500.00');
    assert.equal(slip1.apitTax, '6500.00');
    assert.equal(slip1.netSalary, '156500.00');

    const { db, state } = createInMemoryHrDb();
    const controller = new HrPayrollController(db, new OutboxService(), new InboxService());

    const run = await controller.executePayrollRun({
      tenantId: TENANT_ID,
      actorUserId: USER_ID,
      correlationId: '77777777-7777-4777-8777-777777777771',
      periodMonth: 10,
      periodYear: 2026,
      employeeIds: [EMP_1, EMP_2],
    });

    assert.equal(run.status, 'DISBURSED');
    assert.equal(run.payslipsCount, 2);
    // Total Gross = 175,000 + 90,000 = 265,000.00
    assert.equal(run.totalGrossSalary, '265000.00');
    // Total Employee EPF 8% = 12,000 + 6,400 = 18,400.00
    assert.equal(run.totalEmployeeEpf8, '18400.00');
    // Total Employer EPF 12% = 18,000 + 9,600 = 27,600.00
    assert.equal(run.totalEmployerEpf12, '27600.00');
    // Total Employer ETF 3% = 4,500 + 2,400 = 6,900.00
    assert.equal(run.totalEmployerEtf3, '6900.00');
    // Total APIT = 6,500 + 0 = 6,500.00
    assert.equal(run.totalApitTax, '6500.00');
    // Total Net Payable = 156,500 + 83,600 = 240,100.00
    assert.equal(run.totalNetPayable, '240100.00');
    assert.equal(state.outboxEvents.length, 1);
    assert.equal(state.outboxEvents[0].eventName, ERP_EVENT_PATTERNS.PAYROLL_DISBURSED);
  });
});

