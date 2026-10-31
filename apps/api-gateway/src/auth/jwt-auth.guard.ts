import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  ERP_RPC_PATTERNS,
  TenantContext,
  UserRole,
  ValidateTenantAccessResponse,
} from '@zynveo/contracts';
import {
  CanActivate,
  ErpRpcException,
  ExecutionContext,
  Inject,
  Injectable,
  RpcClientProxy,
  SetMetadata,
} from '@zynveo/microservice-chassis';

export const ROLES_METADATA_KEY = 'zynveo:required_roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_METADATA_KEY, roles);

export const IAM_RPC_CLIENT = 'ZYNVEO_IAM_RPC_CLIENT';

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  tenantContext?: TenantContext;
  user?: {
    userId: string;
    tenantId: string;
    branchId?: string;
    roles: UserRole[];
  };
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64').toString('utf8');
}

export function verifySupabaseJwt(
  token: string,
  jwtSecret?: string,
): {
  sub: string;
  tenantId?: string;
  branchId?: string;
  roles?: UserRole[];
  exp?: number;
} {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new ErpRpcException('UNAUTHORIZED', 'Malformed JWT token', 401);
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  if (jwtSecret) {
    const expectedSig = createHmac('sha256', jwtSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    const a = Buffer.from(signatureB64);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ErpRpcException('UNAUTHORIZED', 'Invalid JWT signature', 401);
    }
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new ErpRpcException('UNAUTHORIZED', 'Invalid JWT payload JSON', 401);
  }

  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
    throw new ErpRpcException('UNAUTHORIZED', 'JWT token has expired', 401);
  }

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new ErpRpcException('UNAUTHORIZED', 'JWT missing subject (sub) claim', 401);
  }

  const appMeta = payload.app_metadata || {};
  return {
    sub: payload.sub,
    tenantId: appMeta.tenant_id || payload.tenant_id,
    branchId: appMeta.branch_id || payload.branch_id,
    roles: Array.isArray(appMeta.roles) ? appMeta.roles : undefined,
    exp: payload.exp,
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly accessCache = new Map<
    string,
    { expiresAt: number; data: ValidateTenantAccessResponse }
  >();

  constructor(
    @Inject(IAM_RPC_CLIENT)
    private readonly iamClient?: RpcClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const rawHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    if (!rawHeader || !rawHeader.startsWith('Bearer ')) {
      throw new ErpRpcException('UNAUTHORIZED', 'Missing Bearer token', 401);
    }

    const token = rawHeader.slice('Bearer '.length).trim();
    const claims = verifySupabaseJwt(token, process.env.SUPABASE_JWT_SECRET);

    const requestedTenantHeader = req.headers['x-tenant-id'];
    const requestedTenantId =
      (Array.isArray(requestedTenantHeader) ? requestedTenantHeader[0] : requestedTenantHeader) ||
      claims.tenantId;

    let resolvedTenantId = requestedTenantId;
    let resolvedBranchId = claims.branchId;
    let resolvedRoles: UserRole[] = claims.roles ?? ['VIEWER'];

    if (this.iamClient) {
      const cacheKey = `${claims.sub}:${requestedTenantId || 'default'}`;
      const cached = this.accessCache.get(cacheKey);
      let access: ValidateTenantAccessResponse;

      if (cached && cached.expiresAt > Date.now()) {
        access = cached.data;
      } else {
        access = await this.iamClient.send<ValidateTenantAccessResponse>(
          ERP_RPC_PATTERNS.IAM.VALIDATE_TENANT_ACCESS,
          {
            userId: claims.sub,
            tenantId: requestedTenantId,
          },
        );
        this.accessCache.set(cacheKey, {
          expiresAt: Date.now() + 60_000,
          data: access,
        });
      }

      if (!access.authorized) {
        throw new ErpRpcException('FORBIDDEN', 'User does not have access to this tenant', 403);
      }
      resolvedTenantId = access.tenantId;
      resolvedBranchId = access.branchId ?? resolvedBranchId;
      resolvedRoles = access.roles;
    }

    if (!resolvedTenantId) {
      throw new ErpRpcException('FORBIDDEN', 'Unable to resolve tenantId for authenticated user', 403);
    }

    const correlationHeader = req.headers['x-correlation-id'];
    const correlationId =
      (Array.isArray(correlationHeader) ? correlationHeader[0] : correlationHeader) ||
      randomUUID();

    // Authoritative TenantContext injected strictly by API Gateway from verified JWT + IAM
    req.tenantContext = {
      tenantId: resolvedTenantId,
      branchId: resolvedBranchId,
      actorUserId: claims.sub,
      correlationId,
    };

    req.user = {
      userId: claims.sub,
      tenantId: resolvedTenantId,
      branchId: resolvedBranchId,
      roles: resolvedRoles,
    };

    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler() as any;
    const cls = context.getClass() as any;
    const requiredRoles: UserRole[] | undefined =
      handler?.[ROLES_METADATA_KEY] ?? cls?.[ROLES_METADATA_KEY];

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRoles = req.user?.roles || [];

    if (userRoles.includes('OWNER') || userRoles.includes('ADMIN')) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new ErpRpcException(
        'FORBIDDEN',
        `Requires one of roles: ${requiredRoles.join(', ')}`,
        403,
      );
    }

    return true;
  }
}

