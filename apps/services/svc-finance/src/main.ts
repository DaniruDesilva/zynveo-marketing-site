import * as financeSchema from '@zynveo/database/finance';
import {
  DrizzleModule,
  InboxService,
  Module,
  OutboxService,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Module({
  imports: [DrizzleModule.forService('finance', financeSchema)],
  controllers: [],
  providers: [OutboxService, InboxService],
})
export class FinanceModule {}

export async function startService(
  port = Number(process.env.SVC_FINANCE_HEALTH_PORT || 4002),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-finance',
    schemaName: 'finance',
    healthPort: port,
    appModule: FinanceModule,
  });
}

if (require.main === module) {
  startService().catch((err) => {
    console.error('Failed to start svc-finance:', err);
    process.exit(1);
  });
}