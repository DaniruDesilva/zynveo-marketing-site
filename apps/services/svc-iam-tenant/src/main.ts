import { and, eq } from 'drizzle-orm';
import {
  ERP_RPC_PATTERNS,
  LogAuditTrailDto,
  LogAuditTrailSchema,
  UserRole,
  UserRoleEnum,
  ValidateTenantAccessDto,
  ValidateTenantAccessResponse,
  ValidateTenantAccessSchema,
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
      };
    }

    const primary = memberships[0];
    const roles: UserRole[] = memberships
      .map((m: any) => String(m.role || 'VIEWER').toUpperCase())
      .filter((r: string): r is UserRole => UserRoleEnum.safeParse(r).success);

    return {
      authorized: true,
      tenantId: primary.tenantId,
      branchId: primary.branchId ?? undefined,
      roles: roles.length > 0 ? roles : ['VIEWER'],
    };
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

