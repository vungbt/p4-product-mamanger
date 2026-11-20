import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auth } from '../dist/configs/better-auth.js';
import { canAccessRecord, requireScopedAbility } from '../dist/middlewares/ability.middleware.js';
import { authRequired } from '../dist/middlewares/auth.middleware.js';
import { portalOpen, portalReferenceDate } from '../dist/modules/portal/portal.access.js';
import { ContractOccupantModel, TenantModel, UserModel } from '../dist/sequelize/models/index.js';

async function guard(middleware, req) {
  let failure;

  await middleware(req, {}, (error) => {
    failure = error;
  });
  return failure;
}

test('legacy tenant requests reach scoped abilities; linked accounts stay on portal DTOs', async (t) => {
  t.mock.method(auth.api, 'getSession', async () => ({ user: { id: 'tenant-user' } }));
  t.mock.method(UserModel, 'findByPk', async () => ({
    id: 'tenant-user',
    role: 'tenant',
    accountStatus: 'active',
    mustChangePassword: false,
  }));
  const profile = t.mock.method(TenantModel, 'findOne', async () => null);
  t.mock.method(ContractOccupantModel, 'findAll', async () => []);
  const request = (path) => ({ path, method: 'GET', headers: {} });
  const legacy = request('/invoices');

  assert.equal(await guard(authRequired, legacy), undefined);
  assert.equal(await guard(requireScopedAbility('read', 'Invoice'), legacy), undefined);
  assert.equal(await guard(requireScopedAbility('read', 'Contract'), legacy), undefined);
  assert.equal(canAccessRecord(legacy.user, 'read', 'Contract', { contractId: 'other' }), false);
  assert.equal((await guard(requireScopedAbility('issue', 'Invoice'), legacy)).statusCode, 403);
  assert.equal((await guard(requireScopedAbility('settle', 'Contract'), legacy)).statusCode, 403);

  profile.mock.mockImplementation(async () => ({ id: 'profile' }));
  for (const path of ['/invoices', '/contracts', '/settings/billing'])
    assert.equal((await guard(authRequired, request(path))).statusCode, 403, path);
  for (const path of ['/me', '/me/capabilities']) {
    const req = request(path);

    assert.equal(await guard(authRequired, req), undefined);
    assert.equal(req.user.tenantId, 'profile');
  }
});

test('portal grace preserves legacy early endings without admitting removed or future occupants', () => {
  const contract = { status: 'ended', startDate: '2042-03-01', movedOutAt: '2026-10-22' };
  const occupant = { tenantId: 'tenant', fromDate: contract.startDate, toDate: null };

  assert.equal(portalReferenceDate(contract, '2026-11-20'), contract.startDate);
  assert.equal(portalOpen(contract, [occupant], 'tenant', '2026-11-20'), true);
  assert.equal(portalOpen(contract, [occupant], 'tenant', '2026-11-22'), false);
  assert.equal(
    portalOpen(contract, [{ ...occupant, toDate: occupant.fromDate }], 'tenant', '2026-11-20'),
    false,
  );
  const active = { ...contract, status: 'active' };

  assert.equal(
    portalOpen(active, [{ ...occupant, fromDate: '2042-04-01' }], 'tenant', '2042-03-10'),
    false,
  );
  const ended = { ...contract, startDate: '2026-01-01' };

  assert.equal(portalReferenceDate(ended, '2026-11-20'), ended.movedOutAt);
  assert.equal(
    portalOpen(ended, [{ ...occupant, fromDate: ended.startDate }], 'tenant', '2026-11-20'),
    true,
  );
});
