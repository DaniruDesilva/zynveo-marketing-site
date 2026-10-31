import * as scmSchema from '@zynveo/database/scm';
import {
  DrizzleModule,
  InboxService,
  Module,
  OutboxService,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Module({
  imports: [DrizzleModule.forService('scm', scmSchema)],
  controllers: [],
  providers: [OutboxService, InboxService],
})
export class ProcurementModule {}

export async function startService(
  port = Number(process.env.SVC_PROCUREMENT_HEALTH_PORT || 4004),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-procurement',
    schemaName: 'scm',
    healthPort: port,
    appModule: ProcurementModule,
  });
}

if (require.main === module) {
  startService().catch((err) => {
    console.error('Failed to start svc-procurement:', err);
    process.exit(1);
  });
}