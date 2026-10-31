import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IamTenantController } from '../main';

describe('svc-iam-tenant IamTenantController Verification', () => {
  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';
  const BRANCH_ID = '33333333-3333-4333-8333-333333333333';

  it('validates active tenant membership and normalizes uppercase roles', async () => {
    const fakeDb = {
      select: () => ({
        from: () => ({
          where: async () => [
            {
              id: '44444444-4444-4444-8444-444444444444',
              userId: USER_ID,
              tenantId: TENANT_ID,
              branchId: BRANCH_ID,
              role: 'accountant',
              isActive: true,
            },
          ],
        }),
      }),
    };

    const controller = new IamTenantController(fakeDb);
    const res = await controller.validateTenantAccess({
      userId: USER_ID,
      tenantId: TENANT_ID,
    });

    assert.equal(res.authorized, true);
    assert.equal(res.tenantId, TENANT_ID);
    assert.equal(res.branchId, BRANCH_ID);
    assert.deepEqual(res.roles, ['ACCOUNTANT']);
  });

  it('returns authorized: false when user has no active membership', async () => {
    const fakeDb = {
      select: () => ({
        from: () => ({
          where: async () => [],
        }),
      }),
    };

    const controller = new IamTenantController(fakeDb);
    const res = await controller.validateTenantAccess({
      userId: USER_ID,
      tenantId: TENANT_ID,
    });

    assert.equal(res.authorized, false);
    assert.deepEqual(res.roles, []);
  });
});

