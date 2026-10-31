import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { TenantContext, TenantContextSchema } from '@zynveo/contracts';
import { ExecutionContext, Injectable, NestInterceptor } from './nest-compat';

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function runWithTenantContext<T>(ctx: TenantContext, fn: () => T): T {
  const normalized: TenantContext = {
    ...ctx,
    correlationId: ctx.correlationId || randomUUID(),
  };
  return tenantStorage.run(normalized, fn);
}

export function getCurrentTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

export function requireTenantContext(): TenantContext {
  const ctx = tenantStorage.getStore();
  if (!ctx) {
    throw new Error('Missing TenantContext in AsyncLocalStorage');
  }
  return ctx;
}

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: { handle: () => any }): Promise<any> {
    const rawData =
      context.getType() === 'rpc'
        ? context.switchToRpc().getData()
        : context.switchToHttp().getRequest()?.tenantContext ??
          context.switchToHttp().getRequest()?.body;

    if (rawData && typeof rawData === 'object') {
      const candidate = {
        tenantId: rawData.tenantId,
        branchId: rawData.branchId,
        actorUserId: rawData.actorUserId,
        correlationId: rawData.correlationId || randomUUID(),
      };
      const parsed = TenantContextSchema.safeParse(candidate);
      if (parsed.success) {
        return runWithTenantContext(parsed.data, () => next.handle());
      }
    }

    return next.handle();
  }
}

