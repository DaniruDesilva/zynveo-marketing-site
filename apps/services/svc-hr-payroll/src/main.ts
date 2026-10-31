import * as hrSchema from '@zynveo/database/hr';
import {
  DrizzleModule,
  InboxService,
  Module,
  OutboxService,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Module({
  imports: [DrizzleModule.forService('hr', hrSchema)],
  controllers: [],
  providers: [OutboxService, InboxService],
})
export class HrPayrollModule {}

export async function startService(
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
  startService().catch((err) => {
    console.error('Failed to start svc-hr-payroll:', err);
    process.exit(1);
  });
}