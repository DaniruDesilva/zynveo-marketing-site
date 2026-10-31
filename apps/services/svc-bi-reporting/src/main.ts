import * as biSchema from '@zynveo/database/bi';
import {
  DrizzleModule,
  InboxService,
  Module,
  OutboxService,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Module({
  imports: [DrizzleModule.forService('bi', biSchema)],
  controllers: [],
  providers: [OutboxService, InboxService],
})
export class BiReportingModule {}

export async function startService(
  port = Number(process.env.SVC_BI_HEALTH_PORT || 4008),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-bi-reporting',
    schemaName: 'bi',
    healthPort: port,
    appModule: BiReportingModule,
  });
}

if (require.main === module) {
  startService().catch((err) => {
    console.error('Failed to start svc-bi-reporting:', err);
    process.exit(1);
  });
}