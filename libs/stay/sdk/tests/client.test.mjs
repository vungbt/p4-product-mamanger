import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStayAuthClient } from '../dist/auth/index.js';
import { ApiSdkError, createStaySdk, getFieldError, unwrap } from '../dist/shared/index.js';

test('SDK sends cookies, per-request token and headers', async () => {
  let token = 'first';
  const received = [];
  const sdk = createStaySdk({
    baseUrl: 'https://stay.example.invalid/',
    getToken: () => token,
    getHeaders: () => ({ 'Accept-Language': 'vi' }),
    fetch: async (request) => {
      received.push(request);
      return Response.json({ data: { user: { id: 'u-1' } } });
    },
  });

  const body = unwrap(await sdk.GET('/api/me', {}));
  token = 'second';
  await sdk.GET('/api/me/capabilities', {});

  assert.equal(body.data.user.id, 'u-1');
  assert.equal(received[0].url, 'https://stay.example.invalid/api/me');
  assert.equal(received[0].credentials, 'include');
  assert.equal(received[0].headers.get('authorization'), 'Bearer first');
  assert.equal(received[1].headers.get('authorization'), 'Bearer second');
  assert.equal(received[0].headers.get('accept-language'), 'vi');
});

test('unwrap maps API errors and 401 calls onUnauthorized', async () => {
  let unauthorized = 0;
  const sdk = createStaySdk({
    baseUrl: 'https://stay.example.invalid',
    onUnauthorized: () => {
      unauthorized++;
    },
    fetch: async () =>
      Response.json(
        { code: 'unauthorized', message: 'Unauthorized', extensions: { email: ['Required'] } },
        { status: 401 },
      ),
  });
  const result = await sdk.GET('/api/me', {});

  assert.throws(
    () => unwrap(result),
    (error) =>
      error instanceof ApiSdkError &&
      error.status === 401 &&
      getFieldError(error, 'email') === 'Required',
  );
  assert.equal(unauthorized, 1);
});

test('auth client targets the Stay Better Auth base path', async () => {
  const client = createStayAuthClient('https://stay.example.invalid/api/');

  assert.equal(typeof client.signIn.email, 'function');
  assert.equal(typeof client.getSession, 'function');
});
