import { and, desc, eq } from 'drizzle-orm';
import {
  ERP_RPC_PATTERNS,
  LogAuditTrailDto,
  LogAuditTrailSchema,
  UserRole,
  UserRoleEnum,
  ValidateTenantAccessDto,
  ValidateTenantAccessResponse,
  ValidateTenantAccessSchema,
  getPermissionsForRoles,
} from '@zynveo/contracts';
import * as iamSchema from '@zynveo/database/iam';
import {
  Controller,
  DRIZZLE_DB,
  DrizzleModule,
  InboxService,
  Inject,
  MessagePattern,
  Module,
  OutboxService,
  Payload,
  bootstrapMicroservice,
} from '@zynveo/microservice-chassis';

@Controller()
export class IamTenantController {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: any,
  ) {}

  @MessagePattern(ERP_RPC_PATTERNS.IAM.VALIDATE_TENANT_ACCESS)
  async validateTenantAccess(
    @Payload() rawPayload: ValidateTenantAccessDto,
  ): Promise<ValidateTenantAccessResponse> {
    const dto = ValidateTenantAccessSchema.parse(rawPayload);

    const conditions = [
      eq(iamSchema.tenantUsers.userId, dto.userId),
      eq(iamSchema.tenantUsers.isActive, true),
    ];
    if (dto.tenantId) {
      conditions.push(eq(iamSchema.tenantUsers.tenantId, dto.tenantId));
    }

    const memberships = await this.db
      .select()
      .from(iamSchema.tenantUsers)
      .where(and(...conditions));

    if (!memberships || memberships.length === 0) {
      return {
        authorized: false,
        tenantId: dto.tenantId || '00000000-0000-4000-8000-000000000000',
        roles: [],
        permissions: [],
      };
    }

    const primary = memberships[0];
    const roles: UserRole[] = memberships
      .map((m: any) => String(m.role || 'VIEWER').toUpperCase())
      .filter((r: string): r is UserRole => UserRoleEnum.safeParse(r).success);

    const effectiveRoles = roles.length > 0 ? roles : (['VIEWER'] as UserRole[]);
    const permissions = getPermissionsForRoles(effectiveRoles);

    return {
      authorized: true,
      tenantId: primary.tenantId,
      branchId: primary.branchId ?? undefined,
      roles: effectiveRoles,
      permissions,
    };
  }

  @MessagePattern(ERP_RPC_PATTERNS.IAM.GET_USER_PROFILE)
  async getUserProfile(@Payload() rawPayload: { userId: string; tenantId: string }) {
    const [user] = await this.db
      .select()
      .from(iamSchema.users)
      .where(eq(iamSchema.users.id, rawPayload.userId));

    const [tenant] = await this.db
      .select()
      .from(iamSchema.tenants)
      .where(eq(iamSchema.tenants.id, rawPayload.tenantId));

    const memberships = await this.db
      .select()
      .from(iamSchema.tenantUsers)
      .where(
        and(
          eq(iamSchema.tenantUsers.userId, rawPayload.userId),
          eq(iamSchema.tenantUsers.tenantId, rawPayload.tenantId),
          eq(iamSchema.tenantUsers.isActive, true),
        ),
      );

    const roles: UserRole[] = memberships
      .map((m: any) => String(m.role || 'VIEWER').toUpperCase())
      .filter((r: string): r is UserRole => UserRoleEnum.safeParse(r).success);
    const effectiveRoles = roles.length > 0 ? roles : (['VIEWER'] as UserRole[]);

    let branchName: string | undefined;
    if (memberships[0]?.branchId) {
      const [branch] = await this.db
        .select()
        .from(iamSchema.branches)
        .where(eq(iamSchema.branches.id, memberships[0].branchId));
      branchName = branch?.name;
    }

    return {
      id: rawPayload.userId,
      email: user?.email || 'admin@zynveo.com',
      firstName: user?.firstName || 'System',
      lastName: user?.lastName || 'Administrator',
      roles: effectiveRoles,
      permissions: getPermissionsForRoles(effectiveRoles),
      tenantId: rawPayload.tenantId,
      tenantName: tenant?.name || 'Zynveo Enterprise Holdings',
      branchId: memberships[0]?.branchId ?? undefined,
      branchName,
      isActive: user?.isActive ?? true,
    };
  }

  @MessagePattern(ERP_RPC_PATTERNS.IAM.LIST_USERS)
  async listUsers(@Payload() rawPayload: { tenantId: string }) {
    const list = await this.db
      .select({
        id: iamSchema.users.id,
        email: iamSchema.users.email,
        firstName: iamSchema.users.firstName,
        lastName: iamSchema.users.lastName,
        isActive: iamSchema.tenantUsers.isActive,
        role: iamSchema.tenantUsers.role,
        branchId: iamSchema.tenantUsers.branchId,
      })
      .from(iamSchema.tenantUsers)
      .innerJoin(iamSchema.users, eq(iamSchema.tenantUsers.userId, iamSchema.users.id))
      .where(eq(iamSchema.tenantUsers.tenantId, rawPayload.tenantId));

    return list.map((item: any) => ({
      id: item.id,
      name: `${item.firstName} ${item.lastName}`,
      email: item.email,
      role: item.role,
      branchId: item.branchId,
      isActive: item.isActive,
    }));
  }

  @MessagePattern(ERP_RPC_PATTERNS.IAM.LOG_AUDIT_TRAIL)
  async logAuditTrail(@Payload() rawPayload: LogAuditTrailDto) {
    const dto = LogAuditTrailSchema.parse(rawPayload);
    const [inserted] = await this.db
      .insert(iamSchema.auditLogs)
      .values({
        tenantId: dto.tenantId,
        actorUserId: dto.actorUserId,
        branchId: dto.branchId ?? null,
        correlationId: dto.correlationId ?? null,
        action: dto.action,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId ?? null,
        metadata: dto.metadata ?? null,
      })
      .returning();

    return { success: true, auditLogId: inserted?.id };
  }
}

@Module({
  imports: [DrizzleModule.forService('iam', iamSchema)],
  controllers: [IamTenantController],
  providers: [OutboxService, InboxService],
})
export class IamTenantModule {}

export async function startIamTenantService(
  port = Number(process.env.SVC_IAM_HEALTH_PORT || 4001),
) {
  return bootstrapMicroservice({
    serviceName: 'svc-iam-tenant',
    schemaName: 'iam',
    healthPort: port,
    appModule: IamTenantModule,
  });
}

if (require.main === module) {
  startIamTenantService().catch((err) => {
    console.error('Failed to start svc-iam-tenant:', err);
    process.exit(1);
  });
}

