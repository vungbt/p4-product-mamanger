import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { after, describe, test } from 'node:test';
import { compare, hash } from 'bcryptjs';
import {
  AuditLogModel,
  BuildingMemberModel,
  ContractDocumentModel,
  ContractOccupantModel,
  DocumentSignerModel,
  sequelize,
  TenantModel,
  UserModel,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 8).toLowerCase();

async function call(cookie, method, path, body, headers = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      origin,
      ...(cookie ? { cookie } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    body: await response.json(),
    headers: response.headers,
    cookie: response.headers
      .getSetCookie()
      .map((part) => part.split(';')[0])
      .join('; '),
  };
}

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

async function login(email, password) {
  const result = await call(null, 'POST', '/auth/sign-in/email', { email, password });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return result.cookie;
}

describe('tenant accounts and shared dashboard', { skip: !base }, () => {
  after(() => sequelize.close());

  test('creation, credential lifecycle, phone sign-in, CASL scoping and legacy portal', async () => {
    const owner = await login('owner@stay.local', 'stay-owner-123');
    const building = ok(await call(owner, 'GET', '/buildings')).find((item) => item.code === 'A');

    async function fixture(index) {
      const phone = `09${String(randomInt(100000000)).padStart(8, '0')}`;
      const tenant = ok(
        await call(owner, 'POST', '/tenants', {
          buildingId: building.id,
          fullName: `Account ${suffix} ${index}`,
          phone,
        }),
        201,
      );
      const row = await TenantModel.findByPk(tenant.id);
      const user = await UserModel.findByPk(row.userId);

      assert.equal(user.role, 'tenant');
      assert.equal(user.email, `tenant-${tenant.id}@accounts.stay.invalid`);
      assert.equal(user.mustChangePassword, true);
      const room = ok(
        await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
          code: `AC${suffix}${index}`,
          floor: 1,
          listPrice: 1000000,
          maxOccupants: 3,
          initialElectric: 0,
          initialWater: 0,
        }),
        201,
      );
      const draft = ok(
        await call(owner, 'POST', '/contracts', {
          roomId: room.id,
          startDate: '2044-01-01',
          endDate: null,
          rent: 1000000,
          depositAmount: 0,
          depositCollected: false,
          depositMethod: 'cash',
          initialElectric: 0,
          initialWater: 0,
          occupantIds: [tenant.id],
          primaryTenantId: tenant.id,
          serviceIds: [],
          vehicleIds: [],
        }),
        201,
      );
      const contract = ok(await call(owner, 'POST', `/contracts/${draft.id}/activate`));
      const [moveIn] = ok(
        await call(owner, 'GET', `/invoices?contractId=${contract.id}&kind=move_in`),
      );
      const issued = ok(await call(owner, 'POST', '/invoices/issue', { ids: [moveIn.id] }));

      return { tenant, row, user, phone, contract, invoice: issued.invoices[0] };
    }

    const a = await fixture(1);
    const b = await fixture(2);
    const issued = await call(owner, 'POST', `/tenants/${a.tenant.id}/credentials`);
    const credentials = ok(issued);

    assert.equal(issued.headers.get('cache-control'), 'no-store');
    assert.equal(credentials.login, a.phone);
    assert.match(
      credentials.password,
      /^[ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789]{14}$/,
    );
    const [accounts] = await sequelize.query(
      'SELECT password FROM auth_accounts WHERE user_id = :id',
      { replacements: { id: a.row.userId } },
    );
    assert.notEqual(accounts[0].password, credentials.password);
    assert.equal(await compare(credentials.password, accounts[0].password), true);

    const unknown = await call(null, 'POST', '/auth/sign-in/email', {
      email: '0000000000',
      password: credentials.password,
    });
    const wrong = await call(null, 'POST', '/auth/sign-in/email', {
      email: a.phone,
      password: 'wrong-password-123',
    });
    assert.equal(unknown.status, wrong.status);
    assert.deepEqual(unknown.body, wrong.body);

    const temporary = await login(a.phone, credentials.password);
    assert.equal(ok(await call(temporary, 'GET', '/me')).user.mustChangePassword, true);
    assert.equal(
      (
        await call(temporary, 'GET', '/portal/invoices', undefined, {
          'X-Stay-Contract': a.contract.id,
        })
      ).status,
      403,
    );
    assert.equal((await call(temporary, 'GET', '/tenants')).status, 403);
    const changed = await call(temporary, 'POST', '/auth/change-password', {
      currentPassword: credentials.password,
      newPassword: 'private-account-password-123',
      revokeOtherSessions: true,
    });
    assert.equal(changed.status, 200, JSON.stringify(changed.body));
    const signed = await login(`+84${a.phone.slice(1)}`, 'private-account-password-123');
    assert.equal(ok(await call(signed, 'GET', '/me')).user.mustChangePassword, false);
    const scope = { 'X-Stay-Contract': a.contract.id };
    const invoices = ok(await call(signed, 'GET', '/portal/invoices', undefined, scope));
    assert.deepEqual(
      invoices.map((invoice) => invoice.id),
      [a.invoice.id],
    );
    assert.equal(
      (await call(signed, 'GET', `/portal/invoices/${b.invoice.id}`, undefined, scope)).status,
      404,
    );
    assert.equal(
      (
        await call(signed, 'GET', '/portal/invoices', undefined, {
          'X-Stay-Contract': b.contract.id,
        })
      ).status,
      403,
    );
    for (const path of [
      '/tenants',
      '/buildings',
      '/invoices',
      '/contracts',
      '/members',
      '/settings/billing',
    ])
      assert.equal((await call(signed, 'GET', path)).status, 403, path);
    const contract = ok(await call(signed, 'GET', '/portal/contract', undefined, scope));
    const safe = JSON.stringify(contract);
    assert.ok(!safe.includes(b.phone));
    assert.ok(!safe.includes('idNumber'));
    assert.ok(!safe.includes('note'));

    const profile = ok(await call(owner, 'GET', `/tenants/${a.tenant.id}`));
    const realEmail = `tenant-account-${suffix}@example.com`;
    ok(
      await call(owner, 'PUT', `/tenants/${a.tenant.id}`, {
        fullName: a.tenant.fullName,
        phone: a.phone,
        email: realEmail,
        version: profile.version,
      }),
    );
    const emailSession = await login(realEmail, 'private-account-password-123');
    assert.equal(ok(await call(emailSession, 'GET', '/me')).user.email, realEmail);

    // Strict account privacy also covers legal originals, not just the contract DTO.
    const document = await ContractDocumentModel.create({
      buildingId: building.id,
      contractId: a.contract.id,
      landlordUserId: ok(await call(owner, 'GET', '/me')).user.id,
      kind: 'contract',
      code: `AC-${suffix}`,
      title: 'Private legal original',
      status: 'sent',
      bodyHtml: `<p>Other occupant phone ${b.phone}</p>`,
      dataSnapshot: { 'ben_thue.ho_ten': b.tenant.fullName, 'ben_thue.sdt': b.phone },
    });
    await DocumentSignerModel.create({
      documentId: document.id,
      role: 'tenant',
      tenantId: a.tenant.id,
      name: a.tenant.fullName,
    });
    const restricted = ok(
      await call(signed, 'GET', `/portal/documents/${document.id}`, undefined, scope),
    );
    assert.equal(restricted.privacyRestricted, true);
    assert.equal(restricted.bodyHtml, null);
    assert.equal(restricted.awaitingMe, false);
    assert.equal(
      (await call(signed, 'GET', `/portal/documents/${document.id}/pdf`, undefined, scope)).status,
      403,
    );

    // Existing pre-migration profiles can be provisioned on first credential issue.
    const legacy = await TenantModel.create({
      buildingId: building.id,
      fullName: `Legacy ${suffix}`,
      phone: `09${String(randomInt(100000000)).padStart(8, '0')}`,
      email: `legacy-${suffix}@example.com`,
    });
    const originalUserId = legacy.userId;
    await legacy.update({ userId: null });
    await UserModel.destroy({ where: { id: originalUserId } });
    const lazy = ok(await call(owner, 'POST', `/tenants/${legacy.id}/credentials`));
    await legacy.reload();
    assert.ok(legacy.userId);
    assert.equal((await UserModel.findByPk(legacy.userId)).email, `legacy-${suffix}@example.com`);
    const byEmail = await login(`legacy-${suffix}@example.com`, lazy.password);
    assert.equal(ok(await call(byEmail, 'GET', '/me')).user.mustChangePassword, true);
    assert.equal(
      (
        await call(owner, 'POST', `/tenants/${legacy.id}/credentials/email`, {
          password: 'obsolete-password',
        })
      ).status,
      409,
    );

    // The occupant trigger also provisions a pre-migration profile before issuing passwords.
    const occupant = await TenantModel.create({
      buildingId: building.id,
      fullName: `Occupant ${suffix}`,
      phone: `09${String(randomInt(100000000)).padStart(8, '0')}`,
    });
    const previousUserId = occupant.userId;
    await occupant.update({ userId: null });
    await UserModel.destroy({ where: { id: previousUserId } });
    await ContractOccupantModel.create({
      contractId: b.contract.id,
      tenantId: occupant.id,
      isPrimary: false,
      fromDate: '2044-01-01',
    });
    await occupant.reload();
    assert.ok(occupant.userId);
    assert.equal((await UserModel.findByPk(occupant.userId)).role, 'tenant');

    const imported = ok(
      await call(
        owner,
        'POST',
        '/tenants/import',
        {
          buildingId: building.id,
          rows: [
            {
              line: 2,
              values: {
                fullName: 'Duplicate email',
                phone: `09${String(randomInt(100000000)).padStart(8, '0')}`,
                email: `legacy-${suffix}@example.com`,
              },
            },
            {
              line: 3,
              values: {
                fullName: 'Imported account',
                phone: `09${String(randomInt(100000000)).padStart(8, '0')}`,
                email: `import-account-${suffix}@example.com`,
              },
            },
          ],
        },
        { 'Idempotency-Key': randomUUID() },
      ),
      201,
    );
    assert.equal(imported.createdCount, 1);
    assert.equal(imported.skippedCount, 1);
    const importedTenant = await TenantModel.findByPk(imported.tenantIds[0]);
    assert.equal((await UserModel.findByPk(importedTenant.userId)).role, 'tenant');

    // Multiple contracts and removed occupants are resolved afresh on every request.
    const additional = await ContractOccupantModel.create({
      contractId: b.contract.id,
      tenantId: a.tenant.id,
      isPrimary: false,
      fromDate: '2044-01-01',
    });
    const multiple = ok(await call(signed, 'GET', '/me')).user.contractIds;
    assert.ok(multiple.includes(a.contract.id) && multiple.includes(b.contract.id));
    assert.equal(
      ok(
        await call(signed, 'GET', '/portal/invoices', undefined, {
          'X-Stay-Contract': b.contract.id,
        }),
      )[0].id,
      b.invoice.id,
    );
    await additional.update({ toDate: '2044-01-01' });
    assert.equal(
      (
        await call(signed, 'GET', '/portal/invoices', undefined, {
          'X-Stay-Contract': b.contract.id,
        })
      ).status,
      403,
    );

    // Operations managers issue only within assigned buildings; other groups cannot issue.
    const managerId = randomUUID();
    await UserModel.create({
      id: managerId,
      email: `manager-account-${suffix}@example.com`,
      displayName: 'Manager',
      emailVerified: false,
      avatarUrl: null,
      role: 'manager',
      accountStatus: 'active',
      permissionGroups: ['operations'],
    });
    await sequelize.query(
      "INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:id,:userId,'credential',:userId,:password)",
      {
        replacements: {
          id: randomUUID(),
          userId: managerId,
          password: await hash('manager-private-password-123', 10),
        },
      },
    );
    const manager = await login(
      `manager-account-${suffix}@example.com`,
      'manager-private-password-123',
    );
    assert.equal((await call(manager, 'POST', `/tenants/${b.tenant.id}/credentials`)).status, 404);
    await BuildingMemberModel.create({
      userId: managerId,
      buildingId: building.id,
      role: 'manager',
    });
    ok(await call(manager, 'POST', `/tenants/${b.tenant.id}/credentials`));
    await UserModel.update({ permissionGroups: ['readings'] }, { where: { id: managerId } });
    assert.equal((await call(manager, 'POST', `/tenants/${b.tenant.id}/credentials`)).status, 403);

    const link = ok(
      await call(owner, 'POST', `/contracts/${a.contract.id}/portal-links`, {
        tenantId: a.tenant.id,
      }),
      201,
    );
    const legacySession = await call(null, 'POST', '/portal/sessions', {
      token: link.path.slice(3),
      phoneLast4: a.phone.slice(-4),
    });
    assert.equal(legacySession.status, 201, JSON.stringify(legacySession.body));
    assert.equal(
      ok(await call(legacySession.cookie, 'GET', '/portal/invoices'))[0].id,
      a.invoice.id,
    );

    ok(await call(owner, 'POST', `/tenants/${a.tenant.id}/credentials`));
    assert.equal((await call(signed, 'GET', '/me')).status, 401);
    const audit = await AuditLogModel.findAll({ where: { resourceId: a.tenant.id } });
    assert.ok(audit.length);
    assert.ok(!JSON.stringify(audit).includes(credentials.password));
  });
});
