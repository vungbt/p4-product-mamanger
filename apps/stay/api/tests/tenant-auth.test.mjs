import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';

// Exercise the production-only public-password policy without a database.
process.env.NODE_ENV = 'production';
const { auth } = await import('../dist/configs/better-auth.js');
const { tenantAuth } = await import('../dist/configs/tenant-auth.js');
const { TenantModel, UserModel } = await import('../dist/sequelize/models/index.js');

function request(path, body) {
  return new Request(`http://localhost/api/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('phone resolution keeps lookup work equal and public passwords on the audited auth path', async (t) => {
  const userId = randomUUID();
  let tenants = [];
  let forwarded;
  const users = t.mock.method(UserModel, 'findOne', async ({ where }) =>
    where.id === userId ? { email: 'tenant@example.com' } : null,
  );
  t.mock.method(TenantModel, 'findAll', async () => tenants);
  const handler = t.mock.method(auth, 'handler', async (req) => {
    forwarded = await req.json();
    return Response.json({ code: 'INVALID_EMAIL_OR_PASSWORD' }, { status: 401 });
  });

  for (const profiles of [[], [{ userId }], [{ userId }, { userId: randomUUID() }]]) {
    tenants = profiles;
    const before = users.mock.callCount();
    const result = await tenantAuth.handler(
      request('/sign-in/email', { email: '+84912345678', password: 'stay-owner-123' }),
    );

    assert.equal(result.status, 401);
    assert.equal(users.mock.callCount(), before + 1);
    assert.notEqual(forwarded.password, 'stay-owner-123');
    assert.match(forwarded.password, /^blocked-/);
    assert.equal(forwarded.email === 'tenant@example.com', profiles.length === 1);
  }
  assert.equal(handler.mock.callCount(), 3);

  await tenantAuth.handler(
    request('/sign-in/email', { email: ' Tenant@Example.com ', password: 'private-password-123' }),
  );
  assert.equal(forwarded.email, 'tenant@example.com');
  assert.equal(forwarded.password, 'private-password-123');
});

test('temporary sessions cannot use other auth endpoints or reuse the temporary password', async (t) => {
  t.mock.method(auth.api, 'getSession', async () => ({ user: { id: randomUUID() } }));
  t.mock.method(UserModel, 'findByPk', async () => ({ mustChangePassword: true }));
  const handler = t.mock.method(auth, 'handler', async () => Response.json({ ok: true }));

  for (const path of ['/update-user', '/change-email', '/link-social', '/list-sessions']) {
    const response = await tenantAuth.handler(request(path, {}));

    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, 'MUST_CHANGE_PASSWORD');
  }
  assert.equal(handler.mock.callCount(), 0);
  assert.equal(
    (
      await tenantAuth.handler(
        request('/change-password', {
          currentPassword: 'temporary',
          newPassword: 'temporary',
        }),
      )
    ).status,
    400,
  );
  for (const path of ['/get-session', '/change-password', '/sign-out'])
    assert.equal((await tenantAuth.handler(request(path, {}))).status, 200);
});
