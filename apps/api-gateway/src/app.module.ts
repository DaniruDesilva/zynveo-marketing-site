import { Module, createRedisRpcClient } from '@zynveo/microservice-chassis';
import {
  IAM_RPC_CLIENT,
  JwtAuthGuard,
  PermissionsGuard,
  RolesGuard,
} from './auth/jwt-auth.guard';
import { ErpGatewayController, GATEWAY_RPC_BUS } from './controllers/erp-gateway.controller';

@Module({
  controllers: [ErpGatewayController],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    {
      provide: IAM_RPC_CLIENT,
      useFactory: () => createRedisRpcClient(),
    },
    {
      provide: GATEWAY_RPC_BUS,
      useFactory: () => createRedisRpcClient(),
    },
  ],
})
export class ApiGatewayModule {}

