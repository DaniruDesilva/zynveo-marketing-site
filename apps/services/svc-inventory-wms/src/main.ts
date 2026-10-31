import * as inventorySchema from '@zynveo/database/inventory';
import {
  DrizzleModule,
  InboxService,
  Module,
  OutboxService,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Module({
  imports: [DrizzleModule.forService('inventory', inventorySchema)],
  controllers: [],
  providers: [OutboxService, InboxService],
})
export class InventoryWmsModule {}

export async function startService(
  port = Number(process.env.SVC_INVENTORY_HEALTH_PORT || 4005),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-inventory-wms',
    schemaName: 'inventory',
    healthPort: port,
    appModule: InventoryWmsModule,
  });
}

if (require.main === module) {
  startService().catch((err) => {
    console.error('Failed to start svc-inventory-wms:', err);
    process.exit(1);
  });
}