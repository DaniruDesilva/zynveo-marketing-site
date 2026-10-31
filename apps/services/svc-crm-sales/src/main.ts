import * as salesCrmSchema from '@zynveo/database/sales_crm';
import {
  DrizzleModule,
  InboxService,
  Module,
  OutboxService,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Module({
  imports: [DrizzleModule.forService('sales_crm', salesCrmSchema)],
  controllers: [],
  providers: [OutboxService, InboxService],
})
export class CrmSalesModule {}

export async function startService(
  port = Number(process.env.SVC_SALES_CRM_HEALTH_PORT || 4007),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-crm-sales',
    schemaName: 'sales_crm',
    healthPort: port,
    appModule: CrmSalesModule,
  });
}

if (require.main === module) {
  startService().catch((err) => {
    console.error('Failed to start svc-crm-sales:', err);
    process.exit(1);
  });
}