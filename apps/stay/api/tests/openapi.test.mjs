// The generator reads Better Auth's schema from the database, so it runs with the integration suite.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import YAML from 'yaml';

const base = process.env.STAY_TEST_API_URL;

test('openapi.yaml matches the routes and types in source', { skip: !base }, () => {
  const result = spawnSync(
    process.execPath,
    ['../../api/scripts/openapi/generate.mjs', '--config', 'scripts/openapi/config.mjs', '--check'],
    { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('the served document and Scalar reference describe the Stay API', {
  skip: !base,
}, async () => {
  const spec = await fetch(`${base}/api/openapi.json`).then((response) => response.json());
  const raw = YAML.parse(await readFile(new URL('../openapi.yaml', import.meta.url), 'utf8'));

  assert.equal(spec.info.title, 'Stay API');
  assert.equal(raw.components.securitySchemes.sessionCookie.name, 'stay.session_token');
  for (const path of ['/api/me', '/api/me/capabilities', '/api/auth/sign-in/email'])
    assert.ok(spec.paths[path], path);
  assert.equal((await fetch(`${base}/api/docs`)).status, 200);
});
