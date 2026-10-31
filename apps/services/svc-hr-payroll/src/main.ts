import Decimal from 'decimal.js';
import { and, eq } from 'drizzle-orm';
import {
  ERP_EVENT_PATTERNS,
  ERP_RPC_PATTERNS,
  ExecutePayrollRunDto,
  ExecutePayrollRunSchema,
  GeneratePayslipPdfDto,
  GeneratePayslipPdfSchema,
  PayrollDisbursedEventSchema,
} from '@zynveo/contracts';
import * as hrSchema from '@zynveo/database/hr';
import {
  Controller,
  DRIZZLE_DB,
  DrizzleModule,
  ErpRpcException,
  InboxService,
  Inject,
  MessagePattern,
  Module,
  OutboxService,
  Payload,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

export interface StatutoryPayslipCalculation {
  basicSalary: string;
  allowances: string;
  overtimePay: string;
  grossSalary: string;
  employeeEpf8: string;
  employerEpf12: string;
  employerEtf3: string;
  apitTax: string;
  otherDeductions: string;
  netSalary: string;
}

/**
 * Pure Decimal progressive monthly APIT (Advance Personal Income Tax) calculator:
 *   - First 100,000.00: 0%
 *   - Next 41,666.67:   6%
 *   - Next 41,666.67:  12%
 *   - Next 41,666.67:  18%
 *   - Next 41,666.67:  24%
 *   - Next 41,666.67:  30%
 *   - Balance above:   36%
 */
export function calculateMonthlyApitTax(grossMonthlyIncome: string): string {
  const gross = new Decimal(grossMonthlyIncome);
  const taxFreeThreshold = new Decimal('100000.00');
  if (gross.lte(taxFreeThreshold)) {
    return '0.00';
  }

  let taxableRemaining = gross.minus(taxFreeThreshold);
  const slabSize = new Decimal('41666.67');
  const rates = [
    new Decimal('0.06'),
    new Decimal('0.12'),
    new Decimal('0.18'),
    new Decimal('0.24'),
    new Decimal('0.30'),
  ];

  let totalTax = new Decimal(0);
  for (const rate of rates) {
    if (taxableRemaining.lte(0)) break;
    const slabAmount = taxableRemaining.lte(slabSize) ? taxableRemaining : slabSize;
    totalTax = totalTax.plus(slabAmount.mul(rate));
    taxableRemaining = taxableRemaining.minus(slabAmount);
  }

  if (taxableRemaining.gt(0)) {
    totalTax = totalTax.plus(taxableRemaining.mul(new Decimal('0.36')));
  }

  return totalTax.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * Pure Decimal Statutory Payroll Calculator (EPF 8% Employee, EPF 12% Employer, ETF 3% Employer, APIT Tax).
 */
export function calculateStatutoryPayslip(input: {
  basicSalary: string;
  fixedAllowances?: string;
  overtimePay?: string;
  otherDeductions?: string;
}): StatutoryPayslipCalculation {
  const basic = new Decimal(input.basicSalary).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const allowances = new Decimal(input.fixedAllowances || '0.00').toDecimalPlaces(
    2,
    Decimal.ROUND_HALF_UP,
  );
  const overtime = new Decimal(input.overtimePay || '0.00').toDecimalPlaces(
    2,
    Decimal.ROUND_HALF_UP,
  );
  const otherDed = new Decimal(input.otherDeductions || '0.00').toDecimalPlaces(
    2,
    Decimal.ROUND_HALF_UP,
  );

  const grossSalary = basic.plus(allowances).plus(overtime).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // Statutory EPF/ETF computed on Basic Salary using Decimal
  const employeeEpf8 = basic
    .mul(new Decimal('0.08'))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const employerEpf12 = basic
    .mul(new Decimal('0.12'))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const employerEtf3 = basic
    .mul(new Decimal('0.03'))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  const apitTax = new Decimal(calculateMonthlyApitTax(grossSalary.toFixed(2)));
  const netSalary = grossSalary
    .minus(employeeEpf8)
    .minus(apitTax)
    .minus(otherDed)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    basicSalary: basic.toFixed(2),
    allowances: allowances.toFixed(2),
    overtimePay: overtime.toFixed(2),
    grossSalary: grossSalary.toFixed(2),
    employeeEpf8: employeeEpf8.toFixed(2),
    employerEpf12: employerEpf12.toFixed(2),
    employerEtf3: employerEtf3.toFixed(2),
    apitTax: apitTax.toFixed(2),
    otherDeductions: otherDed.toFixed(2),
    netSalary: netSalary.toFixed(2),
  };
}

@Controller()
export class HrPayrollController {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: any,
    private readonly outboxService: OutboxService,
    private readonly inboxService: InboxService,
  ) {}

  /**
   * Synchronous RPC (`hr.execute_payroll_run`):
   * Computes statutory EPF (8% / 12%), ETF (3%), and APIT tax across the selected employees,
   * persists `hr.payroll_runs` + `hr.payslip_items`, and writes `PAYROLL_DISBURSED` to `hr.outbox_events`
   * inside the same ACID transaction.
   */
  @MessagePattern(ERP_RPC_PATTERNS.HR_PAYROLL.EXECUTE_PAYROLL_RUN)
  async executePayrollRun(@Payload() rawPayload: ExecutePayrollRunDto) {
    const dto = ExecutePayrollRunSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const salaryRows = await tx
        .select()
        .from(hrSchema.salaryStructures)
        .where(eq(hrSchema.salaryStructures.tenantId, dto.tenantId));

      const structureByEmp = new Map<string, any>();
      for (const row of salaryRows) {
        if (row.isActive !== false) {
          structureByEmp.set(row.employeeId, row);
        }
      }

      let totalGrossSalary = new Decimal(0);
      let totalEmployeeEpf8 = new Decimal(0);
      let totalEmployerEpf12 = new Decimal(0);
      let totalEmployerEtf3 = new Decimal(0);
      let totalApitTax = new Decimal(0);
      let totalNetPayable = new Decimal(0);

      const computedPayslips: Array<{
        employeeId: string;
        calc: StatutoryPayslipCalculation;
        pdfS3Key: string;
      }> = [];

      for (const empId of dto.employeeIds) {
        const structure = structureByEmp.get(empId);
        if (!structure) {
          throw new ErpRpcException(
            'SALARY_STRUCTURE_MISSING',
            `Active salary structure not found for employee ${empId}`,
            404,
          );
        }

        const calc = calculateStatutoryPayslip({
          basicSalary: String(structure.basicSalary),
          fixedAllowances: String(structure.fixedAllowances || '0.00'),
        });

        totalGrossSalary = totalGrossSalary.plus(new Decimal(calc.grossSalary));
        totalEmployeeEpf8 = totalEmployeeEpf8.plus(new Decimal(calc.employeeEpf8));
        totalEmployerEpf12 = totalEmployerEpf12.plus(new Decimal(calc.employerEpf12));
        totalEmployerEtf3 = totalEmployerEtf3.plus(new Decimal(calc.employerEtf3));
        totalApitTax = totalApitTax.plus(new Decimal(calc.apitTax));
        totalNetPayable = totalNetPayable.plus(new Decimal(calc.netSalary));

        const periodCode = `${dto.periodYear}-${String(dto.periodMonth).padStart(2, '0')}`;
        computedPayslips.push({
          employeeId: empId,
          calc,
          pdfS3Key: `payslips/${dto.tenantId}/${periodCode}/${empId}.pdf`,
        });
      }

      const runNumber = `PR-${dto.periodYear}${String(dto.periodMonth).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
      const [payrollRun] = await tx
        .insert(hrSchema.payrollRuns)
        .values({
          tenantId: dto.tenantId,
          runNumber,
          periodMonth: dto.periodMonth,
          periodYear: dto.periodYear,
          status: 'DISBURSED',
          totalGrossSalary: totalGrossSalary.toFixed(2),
          totalEmployeeEpf8: totalEmployeeEpf8.toFixed(2),
          totalEmployerEpf12: totalEmployerEpf12.toFixed(2),
          totalEmployerEtf3: totalEmployerEtf3.toFixed(2),
          totalApitTax: totalApitTax.toFixed(2),
          totalNetPayable: totalNetPayable.toFixed(2),
          disbursedAt: new Date(),
          disbursedByUserId: dto.actorUserId,
        })
        .returning();

      await tx.insert(hrSchema.payslipItems).values(
        computedPayslips.map((item) => ({
          tenantId: dto.tenantId,
          payrollRunId: payrollRun.id,
          employeeId: item.employeeId,
          basicSalary: item.calc.basicSalary,
          allowances: item.calc.allowances,
          overtimePay: item.calc.overtimePay,
          grossSalary: item.calc.grossSalary,
          employeeEpf8: item.calc.employeeEpf8,
          employerEpf12: item.calc.employerEpf12,
          employerEtf3: item.calc.employerEtf3,
          apitTax: item.calc.apitTax,
          otherDeductions: item.calc.otherDeductions,
          netSalary: item.calc.netSalary,
          pdfS3Key: item.pdfS3Key,
        })),
      );

      const disbursedPayload = PayrollDisbursedEventSchema.parse({
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        actorUserId: dto.actorUserId,
        correlationId: dto.correlationId,
        payrollRunId: payrollRun.id,
        periodMonth: dto.periodMonth,
        periodYear: dto.periodYear,
        totalGrossSalary: totalGrossSalary.toFixed(2),
        totalEmployeeEpf8: totalEmployeeEpf8.toFixed(2),
        totalEmployerEpf12: totalEmployerEpf12.toFixed(2),
        totalEmployerEtf3: totalEmployerEtf3.toFixed(2),
        totalApitTax: totalApitTax.toFixed(2),
        totalNetPayable: totalNetPayable.toFixed(2),
      });

      const outboxRow = await this.outboxService.enqueue(tx, hrSchema.hrOutboxEvents, {
        tenantId: dto.tenantId,
        actorUserId: dto.actorUserId,
        sourceService: 'svc-hr-payroll',
        aggregateType: 'PAYROLL_RUN',
        aggregateId: payrollRun.id,
        eventName: ERP_EVENT_PATTERNS.PAYROLL_DISBURSED,
        correlationId: dto.correlationId,
        payload: disbursedPayload,
      });

      return {
        payrollRunId: payrollRun.id,
        runNumber: payrollRun.runNumber,
        status: 'DISBURSED' as const,
        payslipsCount: computedPayslips.length,
        totalGrossSalary: totalGrossSalary.toFixed(2),
        totalEmployeeEpf8: totalEmployeeEpf8.toFixed(2),
        totalEmployerEpf12: totalEmployerEpf12.toFixed(2),
        totalEmployerEtf3: totalEmployerEtf3.toFixed(2),
        totalApitTax: totalApitTax.toFixed(2),
        totalNetPayable: totalNetPayable.toFixed(2),
        outboxEventId: outboxRow.id,
      };
    });
  }

  /**
   * Synchronous RPC (`hr.generate_payslip_pdf`):
   * Returns the payslip item breakdown and its S3 storage key.
   */
  @MessagePattern(ERP_RPC_PATTERNS.HR_PAYROLL.GENERATE_PAYSLIP_PDF)
  async generatePayslipPdf(@Payload() rawPayload: GeneratePayslipPdfDto) {
    const dto = GeneratePayslipPdfSchema.parse(rawPayload);

    const rows = await this.db
      .select()
      .from(hrSchema.payslipItems)
      .where(
        and(
          eq(hrSchema.payslipItems.tenantId, dto.tenantId),
          eq(hrSchema.payslipItems.payrollRunId, dto.payrollRunId),
          eq(hrSchema.payslipItems.employeeId, dto.employeeId),
        ),
      );

    const item = rows[0];
    if (!item) {
      throw new ErpRpcException(
        'PAYSLIP_NOT_FOUND',
        `Payslip not found for employee ${dto.employeeId} in run ${dto.payrollRunId}`,
        404,
      );
    }

    return {
      payslipId: item.id,
      payrollRunId: item.payrollRunId,
      employeeId: item.employeeId,
      pdfS3Key: item.pdfS3Key,
      netSalary: item.netSalary,
    };
  }
}

@Module({
  imports: [DrizzleModule.forService('hr', hrSchema)],
  controllers: [HrPayrollController],
  providers: [OutboxService, InboxService],
})
export class HrPayrollModule {}

export async function startHrPayrollService(
  port = Number(process.env.SVC_HR_HEALTH_PORT || 4003),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-hr-payroll',
    schemaName: 'hr',
    healthPort: port,
    appModule: HrPayrollModule,
  });
}

if (require.main === module) {
  startHrPayrollService().catch((err) => {
    console.error('Failed to start svc-hr-payroll:', err);
    process.exit(1);
  });
}
