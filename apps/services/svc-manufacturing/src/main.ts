import * as manufacturingSchema from '@zynveo/database/manufacturing';
import {
  DrizzleModule,
  InboxService,
  Module,
  OutboxService,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Module({
  imports: [DrizzleModule.forService('manufacturing', manufacturingSchema)],
  controllers: [],
  providers: [OutboxService, InboxService],
})
export class ManufacturingModule {}

export async function startService(
  port = Number(process.env.SVC_MANUFACTURING_HEALTH_PORT || 4006),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-manufacturing',
    schemaName: 'manufacturing',
    healthPort: port,
    appModule: ManufacturingModule,
  });
}

if (require.main === module) {
  startService().catch((err) => {
    console.error('Failed to start svc-manufacturing:', err);
    process.exit(1);
  });
}