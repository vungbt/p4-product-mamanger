// Live API + seeded database (scripts/test-stay-api-integration.sh sets STAY_TEST_API_URL).
import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';
import { stayAbilityKit } from '@stay/shared';
import { AuditLogModel, sequelize, UserModel } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const owner = { email: 'owner@stay.local', password: 'stay-owner-123' };

async function signIn(credentials) {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(credentials),
  });
  const setCookies = response.headers.getSetCookie();

  return {
    response,
    body: await response.json(),
    setCookies,
    cookie: setCookies.map((value) => value.split(';')[0]).join('; '),
  };
}

function get(path, headers = {}) {
  return fetch(`${base}${path}`, { headers });
}

describe('Stay API: health, Better Auth, me and capabilities', { skip: !base }, () => {
  after(() => sequelize.close());

  test('health checks the database', async () => {
    const live = await get('/health/live');
    const health = await get('/health');

    assert.equal(live.status, 200);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok', service: '@stay/api', database: 'up' });
  });

  test('unauthenticated requests are rejected', async () => {
    for (const path of ['/api/me', '/api/me/capabilities']) {
      const response = await get(path);

      assert.equal(response.status, 401, path);
      assert.equal((await response.json()).code, 'unauthorized', path);
    }
  });

  test('owner signs in with stay-prefixed cookies and reads /api/me', async () => {
    const { response, body, setCookies, cookie } = await signIn(owner);

    assert.equal(response.status, 200, JSON.stringify(body));
    assert.ok(setCookies.length > 0);
    for (const value of setCookies) assert.match(value, /^stay\./, value);

    const me = await get('/api/me', { cookie });
    const { data } = await me.json();

    assert.equal(me.status, 200);
    assert.equal(data.user.email, owner.email);
    assert.equal(data.user.role, 'owner');
    assert.deepEqual(data.user.buildingIds, []);
    assert.equal('password' in data.user, false);

    const bearer = await get('/api/me', { authorization: `Bearer ${body.token}` });

    assert.equal(bearer.status, 200);
  });

  test('owner capabilities grant every action on every subject', async () => {
    const { cookie } = await signIn(owner);
    const response = await get('/api/me/capabilities', { cookie });
    const { data } = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof data.contractVersion, 'string');
    assert.deepEqual(data.rules, [{ action: '*', subject: 'all' }]);

    const ability = stayAbilityKit.createAppAbility(data.rules);

    for (const action of stayAbilityKit.actions)
      for (const subject of stayAbilityKit.subjects)
        assert.ok(stayAbilityKit.canAccess(ability, action, subject), `${action} ${subject}`);
  });

  test('P4 and Stay session cookies do not collide', async () => {
    const { body } = await signIn(owner);
    // A valid Stay token under P4's cookie name is not a Stay session.
    const p4Named = await get('/api/me', { cookie: `better-auth.session_token=${body.token}` });

    assert.equal(p4Named.status, 401);
  });

  test('wrong passwords fail, public sign-up is disabled and logins are audited', async () => {
    const wrong = await signIn({ email: owner.email, password: 'not-the-password' });

    assert.equal(wrong.response.status, 401);
    assert.equal(wrong.setCookies.length, 0);

    const signUp = await fetch(`${base}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({
        email: 'stranger@stay.local',
        password: 'a-long-password-123',
        name: 'Stranger',
      }),
    });

    assert.notEqual(signUp.status, 200);
    assert.equal(await UserModel.count({ where: { email: 'stranger@stay.local' } }), 0);

    const ownerRow = await UserModel.findOne({ where: { email: owner.email } });

    assert.ok(ownerRow);
    assert.ok(
      (await AuditLogModel.count({
        where: { action: 'auth.login', actorId: ownerRow.id, outcome: 'success' },
      })) > 0,
    );
  });

  test('sign-out ends the session', async () => {
    const { cookie } = await signIn(owner);
    const signOut = await fetch(`${base}/api/auth/sign-out`, {
      method: 'POST',
      headers: { cookie, origin, 'content-type': 'application/json' },
      body: '{}',
    });

    assert.equal(signOut.status, 200);
    assert.equal((await get('/api/me', { cookie })).status, 401);
  });
});
