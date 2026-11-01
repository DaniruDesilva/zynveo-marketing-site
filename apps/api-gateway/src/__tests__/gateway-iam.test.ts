import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';
import {
  ERP_RPC_PATTERNS,
  ValidateTenantAccessResponse,
  ValidateTenantAccessSchema,
} from '@zynveo/contracts';
import { ExecutionContext, RpcClientProxy } from '@zynveo/microservice-chassis';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
  RolesGuard,
} from '../auth/jwt-auth.guard';
import { ErpGatewayController } from '../controllers/erp-gateway.controller';

function signHs256Jwt(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function makeHttpExecutionContext(
  req: AuthenticatedRequest,
  handler: Function,
  cls: Function,
): ExecutionContext {
  return {
    getType: <TContext extends string = string>() => 'http' as TContext,
    getClass: <T = any>() => cls as unknown as T,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: <T = any>() => req as unknown as T,
      getResponse: <T = any>() => ({}) as T,
    }),
    switchToRpc: () => ({
      getData: <T = any>() => ({}) as T,
      getContext: <T = any>() => ({}) as T,
    }),
  };
}

describe('API Gateway + IAM Contract Verification', () => {
  const JWT_SECRET = 'zynveo-super-secret-jwt-key-for-tests';
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';
  const BRANCH_ID = '33333333-3333-4333-8333-333333333333';
  const SPOOFED_TENANT_ID = '99999999-9999-4999-8999-999999999999';

  const dispatchedMessages: Array<{ pattern: { cmd: string }; payload: any }> = [];
  const inMemoryRpcBus: RpcClientProxy = {
    send: async <TResult = unknown, TInput = unknown>(
      pattern: { cmd: string },
      data: TInput,
    ): Promise<TResult> => {
      dispatchedMessages.push({ pattern, payload: data });
      if (pattern.cmd === ERP_RPC_PATTERNS.IAM.VALIDATE_TENANT_ACCESS.cmd) {
        const dto = ValidateTenantAccessSchema.parse(data);
        const response: ValidateTenantAccessResponse = {
          authorized: dto.userId === USER_ID,
          tenantId: TENANT_ID,
          branchId: BRANCH_ID,
          roles: ['SALES_REP'],
        };
        return response as unknown as TResult;
      }
      return { ok: true, echoed: data } as unknown as TResult;
    },
  };

  it('verifies JWT, resolves TenantContext via IAM RPC, and returns /api/v1/iam/me', async () => {
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
    const token = signHs256Jwt(
      {
        sub: USER_ID,
        app_metadata: { tenant_id: TENANT_ID },
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      JWT_SECRET,
    );

    const jwtGuard = new JwtAuthGuard(inMemoryRpcBus);
    const rolesGuard = new RolesGuard();
    const gateway = new ErpGatewayController(inMemoryRpcBus);

    const req: AuthenticatedRequest = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const ctx = makeHttpExecutionContext(req, gateway.getMe, ErpGatewayController);
    assert.equal(await jwtGuard.canActivate(ctx), true);
    assert.equal(rolesGuard.canActivate(ctx), true);

    const me = await gateway.getMe(req);
    assert.equal(me.tenantContext.tenantId, TENANT_ID);
    assert.equal(me.tenantContext.branchId, BRANCH_ID);
    assert.equal(me.tenantContext.actorUserId, USER_ID);
    assert.deepEqual(me.user?.roles, ['SALES_REP']);
  });

  it('strips spoofed tenantId/prices on finalizeInvoice and enforces @Roles guard', async () => {
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
    const token = signHs256Jwt(
      {
        sub: USER_ID,
        app_metadata: { tenant_id: TENANT_ID },
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      JWT_SECRET,
    );

    const jwtGuard = new JwtAuthGuard(inMemoryRpcBus);
    const rolesGuard = new RolesGuard();
    const gateway = new ErpGatewayController(inMemoryRpcBus);

    const req: AuthenticatedRequest = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    // 1. SALES_REP is allowed on finalizeInvoice
    const finalizeCtx = makeHttpExecutionContext(
      req,
      gateway.finalizeInvoice,
      ErpGatewayController,
    );
    await jwtGuard.canActivate(finalizeCtx);
    assert.equal(rolesGuard.canActivate(finalizeCtx), true);

    const invoiceId = '55555555-5555-4555-8555-555555555555';
    const warehouseId = '66666666-6666-4666-8666-666666666666';

    // Client tries to spoof tenantId and unitPrice in body
    await gateway.finalizeInvoice(req, invoiceId, {
      warehouseId,
      tenantId: SPOOFED_TENANT_ID,
      unitPrice: '0.01',
      lines: [{ unitPrice: '0.01' }],
    });

    const lastCall = dispatchedMessages[dispatchedMessages.length - 1];
    assert.equal(lastCall.pattern, ERP_RPC_PATTERNS.SALES_CRM.FINALIZE_INVOICE);
    assert.equal(lastCall.payload.tenantId, TENANT_ID, 'Must use authoritative JWT/IAM tenantId');
    assert.equal(lastCall.payload.actorUserId, USER_ID);
    assert.equal(lastCall.payload.invoiceId, invoiceId);
    assert.equal(lastCall.payload.warehouseId, warehouseId);
    assert.equal(lastCall.payload.unitPrice, undefined, 'Spoofed unitPrice must be stripped');
    assert.equal(lastCall.payload.lines, undefined, 'Spoofed lines must be stripped');

    // 2. SALES_REP is blocked from HR payroll execution (@Roles('HR_MANAGER', 'ACCOUNTANT'))
    const payrollCtx = makeHttpExecutionContext(
      req,
      gateway.executePayrollRun,
      ErpGatewayController,
    );
    assert.throws(
      () => rolesGuard.canActivate(payrollCtx),
      /Requires one of roles: HR_MANAGER, ACCOUNTANT/,
    );
  });

  it('rejects forged JWT signatures and expired tokens with 401 Unauthorized', async () => {
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
    const jwtGuard = new JwtAuthGuard(inMemoryRpcBus);
    const gateway = new ErpGatewayController(inMemoryRpcBus);

    // 1. Forged signature
    const forgedToken = signHs256Jwt(
      { sub: USER_ID, exp: Math.floor(Date.now() / 1000) + 3600 },
      'wrong-secret-signature',
    );
    const forgedReq: AuthenticatedRequest = {
      headers: { authorization: `Bearer ${forgedToken}` },
    };
    const forgedCtx = makeHttpExecutionContext(forgedReq, gateway.getMe, ErpGatewayController);
    await assert.rejects(
      async () => jwtGuard.canActivate(forgedCtx),
      /Invalid JWT cryptographic signature/,
    );

    // 2. Expired token
    const expiredToken = signHs256Jwt(
      { sub: USER_ID, exp: Math.floor(Date.now() / 1000) - 3600 },
      JWT_SECRET,
    );
    const expiredReq: AuthenticatedRequest = {
      headers: { authorization: `Bearer ${expiredToken}` },
    };
    const expiredCtx = makeHttpExecutionContext(expiredReq, gateway.getMe, ErpGatewayController);
    await assert.rejects(
      async () => jwtGuard.canActivate(expiredCtx),
      /JWT token has expired/,
    );

    // 3. Missing Bearer token
    const missingReq: AuthenticatedRequest = { headers: {} };
    const missingCtx = makeHttpExecutionContext(missingReq, gateway.getMe, ErpGatewayController);
    await assert.rejects(
      async () => jwtGuard.canActivate(missingCtx),
      /Missing Bearer token/,
    );
  });
});
