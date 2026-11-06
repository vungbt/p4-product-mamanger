import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import { categoryQueryOptions } from '../../dist/react/index.js';
import { createApiSdk } from '../../dist/shared/index.js';

const baseUrl = process.env.P4_TEST_API_URL;
if (!baseUrl)
  throw new Error('Set P4_TEST_API_URL to the local API origin, e.g. http://127.0.0.1:3001.');
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname))
  throw new Error('This integration test only runs against a local API.');

test('SDK queries filter, sort and paginate using the real category API', async () => {
  const requests = [];
  const sdk = createApiSdk({
    baseUrl,
    fetch: async (request) => {
      requests.push(new URL(request.url));
      return fetch(request);
    },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const options = categoryQueryOptions(sdk);
  try {
    const first = await client.fetchQuery(
      options.list({ page: 1, pageSize: 10, sortBy: 'name', sortOrder: 'asc' }),
    );
    assert.ok(first.meta, 'server pagination metadata is required when query is supplied');
    assert.equal(first.meta.pageSize, 10);
    assert.equal(first.data.length, Math.min(10, first.meta.total));
    assert.ok(first.meta.total > 0, 'seed categories are needed for this integration test');
    assert.equal(first.meta.totalPages, Math.ceil(first.meta.total / 10));

    if (first.meta.totalPages > 1) {
      const second = await client.fetchQuery(
        options.list({ page: 2, pageSize: 10, sortBy: 'name', sortOrder: 'asc' }),
      );
      assert.equal(second.meta.page, 2);
      assert.equal(second.meta.total, first.meta.total);
      assert.ok(second.data.every((row) => !first.data.some((other) => row.id === other.id)));
    }

    const largerPage = await client.fetchQuery(
      options.list({ page: 1, pageSize: 20, sortBy: 'name', sortOrder: 'asc' }),
    );
    assert.equal(largerPage.meta.pageSize, 20);
    assert.equal(largerPage.data.length, Math.min(20, first.meta.total));
    const descending = await client.fetchQuery(
      options.list({ page: 1, pageSize: 10, sortBy: 'name', sortOrder: 'desc' }),
    );
    if (first.meta.total > 1) assert.notEqual(descending.data[0].id, first.data[0].id);
    const slugSort = await client.fetchQuery(
      options.list({ page: 1, pageSize: 10, sortBy: 'slug', sortOrder: 'desc' }),
    );
    assert.equal(slugSort.meta.total, first.meta.total);
    for (const description of ['has', 'none']) {
      const result = await client.fetchQuery(
        options.list({
          page: 1,
          pageSize: 10,
          description,
          sortBy: 'description',
          sortOrder: 'asc',
        }),
      );
      assert.ok(
        result.data.every((row) => Boolean(row.description.trim()) === (description === 'has')),
      );
      assert.ok(result.meta.total <= first.meta.total);
    }

    const q = first.data[0].slug;
    const filtered = await client.fetchQuery(options.list({ page: 1, pageSize: 10, q }));
    assert.ok(filtered.data.some((row) => row.id === first.data[0].id));
    assert.ok(
      filtered.data.every((row) =>
        [row.name, row.slug, row.description].some((value) =>
          value.toLowerCase().includes(q.toLowerCase()),
        ),
      ),
    );
    const empty = await client.fetchQuery(
      options.list({ page: 1, pageSize: 10, q: `missing-category-${crypto.randomUUID()}` }),
    );
    assert.equal(empty.meta.total, 0);
    assert.deepEqual(empty.data, []);
    assert.ok(
      requests.some((url) => url.searchParams.get('page') === '2') || first.meta.totalPages === 1,
    );
    assert.ok(requests.some((url) => url.searchParams.get('sortOrder') === 'desc'));
    assert.ok(requests.some((url) => url.searchParams.get('description') === 'none'));
  } finally {
    client.clear();
  }
});
