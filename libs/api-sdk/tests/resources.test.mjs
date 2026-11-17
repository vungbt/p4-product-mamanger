import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import YAML from 'yaml';
import * as react from '../dist/react/index.js';
import * as shared from '../dist/shared/index.js';

const manifest = JSON.parse(
  await readFile(new URL('../src/shared/operations.json', import.meta.url), 'utf8'),
);
const spec = YAML.parse(
  await readFile(new URL('../../../apps/api/openapi.yaml', import.meta.url), 'utf8'),
);

test('every OpenAPI operation has an executable typed helper, hook and options factory', async () => {
  const ids = Object.values(spec.paths).flatMap((item) =>
    Object.values(item)
      .filter((op) => op?.operationId)
      .map((op) => op.operationId),
  );
  assert.deepEqual(manifest.map((op) => op.operationId).sort(), ids.sort());
  for (const op of manifest) {
    const input = {
      params: {
        path: Object.fromEntries(
          [...op.path.matchAll(/\{([^}]+)\}/g)].map(([, name]) => [name, 'test-id']),
        ),
        query: { q: 'shirt' },
      },
      ...(op.method === 'get' ? {} : { body: {} }),
    };
    if (op.multipart) {
      input.body = new FormData();
      input.body.set('file', new Blob(['sku,quantity\nSKU,1']), 'import.csv');
    }
    let request;
    const sdk = shared.createApiSdk({
      baseUrl: 'https://example.invalid',
      fetch: async (req) => {
        request = req;
        if (op.response === 'blob')
          return new Response('download', {
            headers: { 'content-type': 'application/octet-stream' },
          });
        if (op.response === 'text')
          return new Response('<html>ok</html>', { headers: { 'content-type': 'text/html' } });
        if (op.response === 'empty') return new Response(null, { status: 200 });
        return Response.json({ data: { id: 'test' } });
      },
    });
    const result = await shared.apiOperations[op.name](sdk, input);
    assert.equal(request.method, op.method.toUpperCase(), op.operationId);
    assert.equal(
      new URL(request.url).pathname,
      op.path.replace(/\{[^}]+\}/g, 'test-id'),
      op.operationId,
    );
    assert.equal(
      // biome-ignore lint/performance/noDynamicNamespaceImportAccess: Coverage test must enumerate all generated exports.
      typeof react[`use${op.name[0].toUpperCase()}${op.name.slice(1)}`],
      'function',
      op.operationId,
    );
    assert.equal(
      // biome-ignore lint/performance/noDynamicNamespaceImportAccess: Coverage test must enumerate all generated exports.
      typeof react[op.name + (op.method === 'get' ? 'QueryOptions' : 'MutationOptions')],
      'function',
      op.operationId,
    );
    if (op.multipart) {
      assert.match(request.headers.get('content-type'), /^multipart\/form-data; boundary=/);
      assert.equal((await request.formData()).get('file').name, 'import.csv');
    }
    if (op.response === 'blob') assert.equal(await result.text(), 'download');
    else if (op.response === 'text') assert.equal(result, '<html>ok</html>');
    else if (op.response === 'empty') assert.equal(result, undefined);
    else assert.deepEqual(result, { data: { id: 'test' } });
  }
});

test('generated query options isolate admin/storefront, filters and caller scope; cancellation reaches fetch', async () => {
  let request;
  const sdk = shared.createApiSdk({
    baseUrl: 'https://example.invalid',
    fetch: async (req) => {
      request = req;
      return Response.json({ data: [] });
    },
  });
  const options = react.getAdminProductsQueryOptions(sdk, {
    params: { query: { sortBy: 'stock', categoryId: 'cat', page: 2 } },
  });
  assert.notDeepEqual(options.queryKey, react.getProductsQueryOptions(sdk).queryKey);
  assert.notDeepEqual(
    options.queryKey,
    react.getAdminProductsQueryOptions(sdk, { params: { query: { page: 1 } } }).queryKey,
  );
  assert.deepEqual(
    react.getAdminProductsQueryOptions(sdk, {}, { queryKey: ['tenant', 'one'] }).queryKey,
    ['tenant', 'one'],
  );
  const controller = new AbortController();
  await options.queryFn({ signal: controller.signal });
  assert.equal(new URL(request.url).searchParams.get('sortBy'), 'stock');
  assert.equal(new URL(request.url).searchParams.get('page'), '2');
  controller.abort();
  assert.equal(request.signal.aborted, true);
});

test('update sends partial PUT body, version and idempotency headers without inventing stock', async () => {
  let request;
  const sdk = shared.createApiSdk({
    baseUrl: 'https://example.invalid',
    fetch: async (req) => {
      request = req;
      return Response.json({ data: { id: 'product' } });
    },
  });
  await shared.putProductsId(sdk, {
    params: { path: { id: 'product' } },
    body: { name: 'Renamed', expectedVersion: 4 },
    headers: { 'Idempotency-Key': 'stable-key' },
  });
  assert.deepEqual(await request.json(), { name: 'Renamed', expectedVersion: 4 });
  assert.equal(request.headers.get('idempotency-key'), 'stable-key');
});

test('mutations invalidate generated caches only on success, never retry and preserve API field errors', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  let fail = false,
    calls = 0;
  const sdk = shared.createApiSdk({
    baseUrl: 'https://example.invalid',
    fetch: async () => {
      calls++;
      return fail
        ? Response.json(
            { code: 'version_conflict', extensions: { expectedVersion: ['Reload snapshot'] } },
            { status: 409 },
          )
        : Response.json({ data: {} });
    },
  });
  const listKey = react.getAdminProductsQueryOptions(sdk).queryKey;
  try {
    client.setQueryData(listKey, { data: [] });
    client.setQueryData(['unrelated'], 1);
    const observer = new MutationObserver(client, react.putProductsIdMutationOptions(sdk, client));
    const variables = { params: { path: { id: 'p' } }, body: { name: 'New', expectedVersion: 2 } };
    await observer.mutate(variables);
    assert.equal(client.getQueryState(listKey).isInvalidated, true);
    assert.equal(client.getQueryState(['unrelated']).isInvalidated, false);
    client.setQueryData(listKey, { data: [] });
    fail = true;
    await assert.rejects(
      observer.mutate(variables),
      (error) =>
        error instanceof shared.ApiSdkError &&
        error.code === 'version_conflict' &&
        error.fieldErrors.expectedVersion[0] === 'Reload snapshot',
    );
    assert.equal(calls, 2);
    assert.equal(client.getQueryState(listKey).isInvalidated, false);
    const scoped = new MutationObserver(
      client,
      react.putProductsIdMutationOptions(sdk, client, { invalidate: [] }),
    );
    fail = false;
    await scoped.mutate(variables);
    assert.equal(client.getQueryState(listKey).isInvalidated, false);
  } finally {
    client.clear();
  }
});
