import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as v from 'valibot';
import { readQueryParam, writeQueryParam } from '../src/hooks/use-query-param';

const schema = v.object({
  page: v.optional(
    v.fallback(v.pipe(v.string(), v.transform(Number), v.safeInteger(), v.minValue(1)), 1),
    '1',
  ),
  q: v.optional(v.pipe(v.string(), v.trim())),
  status: v.optional(v.fallback(v.picklist(['active', 'inactive']), 'active')),
});

test('query schema infers typed numbers/enums and handles malformed external URLs', () => {
  assert.deepEqual(
    readQueryParam(schema, new URLSearchParams('page=2&q=+shirt+&status=inactive')),
    { page: 2, q: 'shirt', status: 'inactive' },
  );
  for (const value of ['x', '0', '-2', '1.5', 'Infinity', '']) {
    assert.equal(readQueryParam(schema, new URLSearchParams({ page: value })).page, 1);
  }
  assert.equal(readQueryParam(schema, new URLSearchParams('status=unknown')).status, 'active');
});

test('partial updates preserve unrelated params, delete cleared values and avoid mutating the input', () => {
  const before = new URLSearchParams('page=3&q=old&tab=summary&status=active');
  const after = writeQueryParam(schema, before, { q: 'new', page: 1 });
  assert.equal(before.get('page'), '3');
  assert.equal(after.get('tab'), 'summary');
  assert.equal(after.get('q'), 'new');
  const cleared = writeQueryParam(schema, after, { q: undefined, status: null });
  assert.equal(cleared.has('q'), false);
  assert.equal(cleared.has('status'), false);
  assert.equal(cleared.get('tab'), 'summary');
});

test('functional updates use parsed current values and repeated filters round-trip', () => {
  const updated = writeQueryParam(schema, new URLSearchParams('page=3'), (current) => ({
    page: current.page + 1,
  }));
  assert.equal(readQueryParam(schema, updated).page, 4);
  const arraySchema = v.object({
    tag: v.optional(
      v.pipe(
        v.union([v.string(), v.array(v.string())]),
        v.transform((value) => (typeof value === 'string' ? [value] : value)),
      ),
    ),
  });
  const params = writeQueryParam(arraySchema, new URLSearchParams('tab=shop'), {
    tag: ['size-m', 'color-red'],
  });
  assert.deepEqual(readQueryParam(arraySchema, params).tag, ['size-m', 'color-red']);
  assert.deepEqual(
    readQueryParam(arraySchema, writeQueryParam(arraySchema, params, { tag: ['size-m'] })).tag,
    ['size-m'],
  );
});

function compileChecks() {
  // @ts-expect-error The schema output requires a number, not a URL string.
  writeQueryParam(schema, new URLSearchParams(), { page: '2' });
  // @ts-expect-error Unsupported enum value is rejected.
  writeQueryParam(schema, new URLSearchParams(), { status: 'pending' });
  // @ts-expect-error Unknown fields cannot be set through the typed hook helper.
  writeQueryParam(schema, new URLSearchParams(), { sortField: 'name' });
}
void compileChecks;
