import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Router } from 'express';
import { Op } from 'sequelize';
import {
  applyAuditPolicies,
  assertExplicitCors,
  assertSecret,
  createApiHandlers,
  createBlockedPasswordCheck,
  createCookieOriginGuard,
  dateRange,
  numberRange,
  requestStore,
  requireRole,
  searchPattern,
} from '../dist/index.js';
import {
  BaseError,
  Forbidden,
  InputValidError,
  jsonValue,
  NotFound,
  redact,
  selectFields,
} from '../dist/shared/index.js';

test('errors carry status, code and field extensions', () => {
  const error = new InputValidError('input_valid_error', { name: ['required'] });
  assert.ok(error instanceof BaseError);
  assert.equal(error.statusCode, 400);
  assert.equal(error.code, 'input_valid_error');
  assert.deepEqual(error.extensions, { name: ['required'] });
  assert.equal(new NotFound().statusCode, 404);
  assert.equal(new Forbidden().name, 'Forbidden');
});

test('selectFields, redact and jsonValue keep DTOs and audit payloads explicit', () => {
  assert.deepEqual(selectFields({ id: '1', passwordHash: 'x' }, ['id']), { id: '1' });
  assert.deepEqual(redact({ email: 'a@b.c', nested: [{ token: 't', status: 'ok' }] }), {
    email: '[REDACTED]',
    nested: [{ token: '[REDACTED]', status: 'ok' }],
  });
  assert.equal(JSON.stringify(jsonValue({ b: 1, a: [undefined] })), '{"a":[null],"b":1}');
  assert.throws(() => jsonValue(Number.NaN), InputValidError);
});

test('production checks reject public placeholders and wildcard CORS', () => {
  assert.throws(
    () => assertSecret('SECRET', 'replace-with-a-secret-of-forty-characters', 32),
    /SECRET/,
  );
  assert.throws(() => assertSecret('SECRET', 'short', 32), /at least 32/);
  assert.doesNotThrow(() => assertSecret('SECRET', 'k'.repeat(32), 32));
  assert.throws(() => assertExplicitCors(true), /explicit allowed origins/);
  assert.equal(createBlockedPasswordCheck(true)('admin123'), true);
  assert.equal(createBlockedPasswordCheck(false)('admin123'), false);
});

test('list filters escape LIKE wildcards and build inclusive ranges', () => {
  assert.equal(searchPattern('50%_off\\'), '%50\\%\\_off\\\\%');
  assert.deepEqual(numberRange(0, undefined), { [Op.gte]: 0 });
  const range = dateRange('2026-01-01', '2026-01-31');
  assert.equal(range[Op.lte].toISOString(), '2026-01-31T23:59:59.999Z');
});

test('cookie writes require an allowed origin; bearer requests are exempt', () => {
  const guard = createCookieOriginGuard(() => ['https://app.example.com']);
  const request = (method, headers) => ({
    method,
    headers,
    header: (name) => headers[name.toLowerCase()],
  });
  assert.doesNotThrow(() => guard(request('GET', { cookie: 'a=1' })));
  assert.doesNotThrow(() =>
    guard(request('POST', { cookie: 'a=1', origin: 'https://app.example.com' })),
  );
  assert.doesNotThrow(() =>
    guard(request('POST', { cookie: 'a=1', authorization: 'Bearer t', origin: 'https://x' })),
  );
  assert.throws(
    () => guard(request('POST', { cookie: 'a=1', origin: 'https://evil.example.com' })),
    (error) => error.message === 'invalid_origin',
  );
});

test('requireRole allows only listed roles', () => {
  const middleware = requireRole('admin');
  let result;
  middleware({ user: { id: '1', role: 'user' } }, {}, (error) => {
    result = error;
  });
  assert.ok(result instanceof Forbidden);
  middleware({ user: { id: '1', role: 'admin' } }, {}, (error) => {
    result = error;
  });
  assert.equal(result, undefined);
});

test('audit policies are required for every route and writes run in an audited transaction', async () => {
  const calls = [];
  const { apiHandler } = createApiHandlers(async (options, work) => {
    calls.push(options);
    return work();
  });
  const router = Router();
  router.post(
    '/items',
    apiHandler(async () => ({ id: 'item-1' }), 201),
  );
  assert.throws(() => applyAuditPolicies(router, {}), /Missing explicit audit action/);
  assert.throws(
    () =>
      applyAuditPolicies(router, {
        'POST /items': { action: 'create', resourceType: 'item' },
        'GET /stale': { action: 'read', resourceType: 'item' },
      }),
    /Stale audit route policy/,
  );

  const audited = Router();
  audited.post(
    '/items',
    apiHandler(async () => ({ id: 'item-1' }), 201),
  );
  applyAuditPolicies(audited, { 'POST /items': { action: 'create', resourceType: 'item' } });
  const handlers = audited.stack[0].route.stack;
  const response = await new Promise((resolve, reject) => {
    const res = { jsonApi: (status, body) => resolve({ status, body }) };
    requestStore.run({ requestId: 'r1' }, () => {
      handlers[0].handle({ params: {}, baseUrl: '' }, res, (error) => error && reject(error));
    });
  });
  assert.deepEqual(response, { status: 201, body: { data: { id: 'item-1' } } });
  assert.deepEqual(calls, [{}]);
});
