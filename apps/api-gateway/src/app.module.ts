import { Module } from '@zynveo/microservice-chassis';
import { IAM_RPC_CLIENT, JwtAuthGuard, RolesGuard } from './auth/jwt-auth.guard';
import { ErpGatewayController, GATEWAY_RPC_BUS } from './controllers/erp-gateway.controller';

@Module({
  controllers: [ErpGatewayController],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    {
      provide: IAM_RPC_CLIENT,
      useValue: null,
    },
    {
      provide: GATEWAY_RPC_BUS,
      useValue: null,
    },
  ],
})
export class ApiGatewayModule {}

