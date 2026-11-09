// Startup guarantees that need no database: audit policies and production configuration.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { applyAuditPolicies } from '@p4/server-core';
import { Router } from 'express';
import apiRouter from '../dist/modules/index.js';

const cwd = new URL('..', import.meta.url);

function runProduction(code, env = {}) {
  return spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      STAY_BETTER_AUTH_SECRET: 'a-private-production-secret-of-48-characters-abc',
      STAY_DATABASE_PASSWORD: 'private-db-password',
      STAY_BETTER_AUTH_URL: 'https://stay-api.example.com',
      STAY_CORS_ORIGIN: 'https://stay.example.com',
      ...env,
    },
  });
}

test('every mounted route has an explicit audit policy', () => {
  assert.ok(apiRouter.stack.length > 0);

  const router = Router();

  router.get('/me', (_req, res) => res.end());
  router.get('/undeclared', (_req, res) => res.end());
  assert.throws(
    () => applyAuditPolicies(router, { 'GET /me': { action: 'read', resourceType: 'user' } }),
    /Missing explicit audit action for GET \/undeclared/,
  );
});

test('the local seed password is blocked only in production', async () => {
  const { isBlockedPassword, STAY_SEED_PASSWORD } = await import('../dist/configs/production.js');

  assert.equal(isBlockedPassword(STAY_SEED_PASSWORD), false);

  const result = runProduction(
    "const p = await import('./dist/configs/production.js');" +
      "console.log(p.isBlockedPassword(p.STAY_SEED_PASSWORD), p.isBlockedPassword('admin123'), p.isBlockedPassword('a-real-private-password'));",
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'true true false');
});

test('production refuses placeholder secrets, plain HTTP and wildcard CORS', () => {
  const check = "(await import('./dist/configs/production.js')).assertProductionConfig();";

  assert.equal(runProduction(check).status, 0, runProduction(check).stderr);
  assert.notEqual(runProduction(check, { STAY_BETTER_AUTH_SECRET: '' }).status, 0);
  assert.notEqual(
    runProduction(check, {
      STAY_BETTER_AUTH_SECRET: 'stay-dev-secret-change-me-0123456789abcdef',
    }).status,
    0,
  );
  assert.notEqual(
    runProduction(check, { STAY_BETTER_AUTH_URL: 'http://stay-api.example.com' }).status,
    0,
  );
  assert.notEqual(runProduction(check, { STAY_CORS_ORIGIN: '*' }).status, 0);
});
