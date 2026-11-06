import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { test } from 'node:test';
import YAML from 'yaml';
import { createApp } from '../dist/app.js';
import { documentationServerUrl } from '../dist/configs/openapi-docs.js';

test('Scalar uses current-origin servers and defaults to Node.js Axios', async () => {
  const previous = process.env.PUBLIC_API_URL;
  delete process.env.PUBLIC_API_URL;
  const server = createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${url}/api/openapi.json`);
    assert.equal(response.status, 200);
    const spec = await response.json();
    assert.deepEqual(spec.servers, [{ url: '/', description: 'Current API server' }]);
    for (const path of [
      '/api/processes/{id}',
      '/api/admin/imports/{resource}',
      '/api/admin/exports',
      '/api/orders/{id}/payment-attempts',
      '/api/returns/{id}/inspect',
      '/api/notifications',
    ])
      assert.ok(spec.paths[path], path);
    assert.equal(spec.paths['/api/orders/{id}/shipment'], undefined);
    const html = await fetch(`${url}/api/docs`).then((response) => response.text());
    assert.match(
      html,
      /"defaultHttpClient"\s*:\s*\{\s*"targetKey"\s*:\s*"node",\s*"clientKey"\s*:\s*"axios"\s*\}/,
    );
    const yaml = await fetch(`${url}/api/openapi.yaml`).then((response) => response.text());
    assert.equal(YAML.parse(yaml).info.title, 'P4 Commerce API');
    process.env.PUBLIC_API_URL = 'https://deploy.example.com';
    assert.equal(documentationServerUrl(), 'https://deploy.example.com');
    process.env.PUBLIC_API_URL = 'javascript:alert(1)';
    assert.throws(() => documentationServerUrl());
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_API_URL;
    else process.env.PUBLIC_API_URL = previous;
    await new Promise((resolve) => server.close(resolve));
  }
});

test('openapi.yaml matches the routes and types in source', () => {
  const result = spawnSync(process.execPath, ['scripts/openapi/generate.mjs', '--check'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('every operation is documented for FE consumers', async () => {
  const raw = await readFile(new URL('../openapi.yaml', import.meta.url), 'utf8');
  const spec = YAML.parse(raw);

  for (const [path, item] of Object.entries(spec.paths)) {
    assert.ok(path === '/' || !path.endsWith('/'), `${path} must not end with a slash`);

    for (const [method, operation] of Object.entries(item)) {
      const name = `${method.toUpperCase()} ${path}`;

      assert.notEqual(operation.summary, name, `${name} needs a summary`);
      assert.ok(operation.tags?.length, `${name} needs a tag`);
    }
  }

  for (const path of ['/api/addresses', '/api/cart']) {
    assert.deepEqual(
      spec.paths[path].get.security,
      [{ sessionCookie: [] }, { bearerAuth: [] }],
      path,
    );
  }
  assert.ok(spec.paths['/api/orders'].post.requestBody);
  assert.ok(
    spec.paths['/api/orders'].post.parameters.some((item) => item.name === 'Idempotency-Key'),
  );
});
