import { and, eq, isNull } from 'drizzle-orm';
import {
  ERP_RPC_PATTERNS,
  InviteUserDto,
  InviteUserSchema,
  LogAuditTrailDto,
  LogAuditTrailSchema,
  UpdateTenantSettingsDto,
  UpdateTenantSettingsSchema,
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
      .where(
        and(
          eq(iamSchema.tenantUsers.tenantId, rawPayload.tenantId),
          isNull(iamSchema.tenantUsers.deletedAt),
          isNull(iamSchema.users.deletedAt),
        ),
      );

    return list.map((item: any) => ({
      id: item.id,
      name: `${item.firstName} ${item.lastName}`,
      email: item.email,
      role: item.role,
      branchId: item.branchId,
      isActive: item.isActive,
    }));
  }

  @MessagePattern(ERP_RPC_PATTERNS.IAM.GET_TENANT_SETTINGS)
  async getTenantSettings(@Payload() rawPayload: { tenantId: string }) {
    const [tenant] = await this.db
      .select()
      .from(iamSchema.tenants)
      .where(
        and(
          eq(iamSchema.tenants.id, rawPayload.tenantId),
          isNull(iamSchema.tenants.deletedAt),
        ),
      );

    const branchRows = await this.db
      .select()
      .from(iamSchema.branches)
      .where(
        and(
          eq(iamSchema.branches.tenantId, rawPayload.tenantId),
          isNull(iamSchema.branches.deletedAt),
        ),
      );

    return {
      tenantId: tenant?.id || rawPayload.tenantId,
      name: tenant?.name || 'Zynveo Enterprise Holdings',
      slug: tenant?.slug || 'zynveo-enterprise',
      baseCurrency: tenant?.baseCurrency || 'USD',
      isActive: tenant?.isActive ?? true,
      branchCount: branchRows.length,
    };
  }

  @MessagePattern(ERP_RPC_PATTERNS.IAM.UPDATE_TENANT_SETTINGS)
  async updateTenantSettings(@Payload() rawPayload: UpdateTenantSettingsDto) {
    const dto = UpdateTenantSettingsSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (dto.companyName) updates.name = dto.companyName;
      if (dto.baseCurrency) updates.baseCurrency = dto.baseCurrency.toUpperCase();

      const [updated] = await tx
        .update(iamSchema.tenants)
        .set(updates)
        .where(
          and(
            eq(iamSchema.tenants.id, dto.tenantId),
            isNull(iamSchema.tenants.deletedAt),
          ),
        )
        .returning();

      await tx.insert(iamSchema.auditLogs).values({
        tenantId: dto.tenantId,
        actorUserId: dto.actorUserId,
        branchId: dto.branchId ?? null,
        correlationId: dto.correlationId ?? null,
        action: 'TENANT_SETTINGS_UPDATED',
        resourceType: 'TENANT',
        resourceId: dto.tenantId,
        metadata: {
          companyName: dto.companyName,
          baseCurrency: dto.baseCurrency,
          taxId: dto.taxId,
          fiscalYearStartMonth: dto.fiscalYearStartMonth,
        },
      });

      const branchRows = await tx
        .select()
        .from(iamSchema.branches)
        .where(
          and(
            eq(iamSchema.branches.tenantId, dto.tenantId),
            isNull(iamSchema.branches.deletedAt),
          ),
        );

      return {
        tenantId: updated?.id || dto.tenantId,
        name: updated?.name || dto.companyName || 'Zynveo Enterprise Holdings',
        slug: updated?.slug || 'zynveo-enterprise',
        baseCurrency: updated?.baseCurrency || dto.baseCurrency || 'USD',
        isActive: updated?.isActive ?? true,
        branchCount: branchRows.length,
      };
    });
  }

  @MessagePattern(ERP_RPC_PATTERNS.IAM.LIST_BRANCHES)
  async listBranches(@Payload() rawPayload: { tenantId: string }) {
    return this.db
      .select()
      .from(iamSchema.branches)
      .where(
        and(
          eq(iamSchema.branches.tenantId, rawPayload.tenantId),
          isNull(iamSchema.branches.deletedAt),
        ),
      );
  }

  @MessagePattern(ERP_RPC_PATTERNS.IAM.INVITE_USER)
  async inviteUser(@Payload() rawPayload: InviteUserDto) {
    const dto = InviteUserSchema.parse(rawPayload);

    return this.db.transaction(async (tx: any) => {
      const existingUsers = await tx
        .select()
        .from(iamSchema.users)
        .where(and(eq(iamSchema.users.email, dto.email), isNull(iamSchema.users.deletedAt)));

      let user = existingUsers[0];
      if (!user) {
        const [createdUser] = await tx
          .insert(iamSchema.users)
          .values({
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            isActive: true,
          })
          .returning();
        user = createdUser;
      }

      const existingMembership = await tx
        .select()
        .from(iamSchema.tenantUsers)
        .where(
          and(
            eq(iamSchema.tenantUsers.tenantId, dto.tenantId),
            eq(iamSchema.tenantUsers.userId, user.id),
            isNull(iamSchema.tenantUsers.deletedAt),
          ),
        );

      let membership = existingMembership[0];
      if (!membership) {
        const [createdMembership] = await tx
          .insert(iamSchema.tenantUsers)
          .values({
            tenantId: dto.tenantId,
            userId: user.id,
            branchId: dto.branchId ?? null,
            role: dto.role,
            isActive: true,
          })
          .returning();
        membership = createdMembership;
      }

      await tx.insert(iamSchema.auditLogs).values({
        tenantId: dto.tenantId,
        actorUserId: dto.actorUserId,
        branchId: dto.branchId ?? null,
        correlationId: dto.correlationId ?? null,
        action: 'USER_INVITED',
        resourceType: 'USER',
        resourceId: user.id,
        metadata: { email: dto.email, role: dto.role },
      });

      return {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: membership.role,
        branchId: membership.branchId,
        isActive: membership.isActive,
      };
    });
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

