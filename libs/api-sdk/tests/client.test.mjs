import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiSdkError, createApiSdk, getFieldError, unwrap } from '../dist/shared/index.js';

test('SDK evaluates per-request auth/headers and passes query and abort signal', async () => {
  let token = 'first';
  const received = [];
  const sdk = createApiSdk({
    baseUrl: 'https://api.example.invalid',
    getToken: () => token,
    getHeaders: () => ({ 'Accept-Language': 'vi' }),
    fetch: async (request) => {
      received.push(request);
      return Response.json({ data: [] });
    },
  });
  const controller = new AbortController();
  unwrap(
    await sdk.GET('/api/categories', {
      params: { query: { page: 2, pageSize: 10, sortBy: 'slug', sortOrder: 'desc' } },
      signal: controller.signal,
    }),
  );
  token = 'second';
  await sdk.GET('/api/categories', {});
  assert.equal(received[0].headers.get('authorization'), 'Bearer first');
  assert.equal(received[1].headers.get('authorization'), 'Bearer second');
  assert.equal(received[0].headers.get('accept-language'), 'vi');
  assert.equal(new URL(received[0].url).searchParams.get('sortBy'), 'slug');
  assert.equal(received[0].credentials, 'include');
  controller.abort();
  assert.equal(received[0].signal.aborted, true);
});

test('SDK maps field errors without automatically retrying mutations', async () => {
  let calls = 0;
  const sdk = createApiSdk({
    baseUrl: 'https://api.example.invalid',
    fetch: async () => {
      calls++;
      return Response.json(
        {
          code: 'input_valid_error',
          message: 'Duplicate slug',
          extensions: { slug: ['Slug is in use.'] },
        },
        { status: 400 },
      );
    },
  });
  const result = await sdk.POST('/api/categories', { body: { name: 'Test', slug: 'test' } });
  assert.throws(
    () => unwrap(result),
    (error) => error instanceof ApiSdkError && getFieldError(error, 'slug') === 'Slug is in use.',
  );
  assert.equal(calls, 1);
});
