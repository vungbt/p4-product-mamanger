import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NODE_ENV = 'production';
process.env.CORS_ORIGIN = 'https://p4.couponlinkh.com';
process.env.BETTER_AUTH_URL = 'https://p4-api.couponlinkh.com';

const { assertProductionConfig, isBlockedPassword } = await import('../dist/configs/production.js');
const strong = 'k'.repeat(48);

function withEnv(values, fn) {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous))
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
}

const valid = {
  BETTER_AUTH_SECRET: strong,
  MAIL_ENCRYPTION_KEY: strong,
  DATABASE_PASSWORD: 'a-private-db-password',
};

test('accepts private production secrets', () => {
  withEnv(valid, () => assert.doesNotThrow(assertProductionConfig));
});

test('rejects secrets copied from the public examples', () => {
  for (const [name, value] of [
    ['BETTER_AUTH_SECRET', 'replace-with-a-random-secret-at-least-32-characters'],
    ['MAIL_ENCRYPTION_KEY', 'replace-with-separate-random-key-at-least-32-characters'],
    ['DATABASE_PASSWORD', 'change-me-strong-password'],
    ['DATABASE_PASSWORD', 'postgres'],
  ])
    withEnv({ ...valid, [name]: value }, () =>
      assert.throws(assertProductionConfig, new RegExp(name)),
    );
});

test('published demo passwords are blocked in production', () => {
  for (const password of ['admin123', 'user123', 'password123'])
    assert.equal(isBlockedPassword(password), true, password);
  assert.equal(isBlockedPassword('a-private-password'), false);
});
