import { bootstrapMicroservice } from '@zynveo/microservice-chassis';
import { ApiGatewayModule } from './app.module';

export async function startApiGateway(port = Number(process.env.API_GATEWAY_PORT || 4000)) {
  return bootstrapMicroservice({
    serviceName: 'api-gateway',
    schemaName: 'gateway',
    healthPort: port,
    appModule: ApiGatewayModule,
  });
}

if (require.main === module) {
  startApiGateway().catch((err) => {
    console.error('Failed to start api-gateway:', err);
    process.exit(1);
  });
}

