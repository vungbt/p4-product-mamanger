import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import {
  categoryKeys,
  categoryMutationOptions,
  categoryQueryOptions,
} from '../dist/react/index.js';
import { ApiSdkError, createApiSdk, getFieldError } from '../dist/shared/index.js';

const category = { id: 'category-1', name: 'Clothing', slug: 'clothing', description: '' };

function fixture(fetch) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const sdk = createApiSdk({ baseUrl: 'https://api.example.invalid', fetch });
  return { client, sdk };
}

test('category queries isolate filter keys and share cached data with detail queries', async () => {
  const requests = [];
  const { client, sdk } = fixture(async (request) => {
    requests.push(request);
    return Response.json({ data: request.url.includes('category-1') ? category : [category] });
  });
  try {
    const options = categoryQueryOptions(sdk);
    const list = options.list({ q: 'shirt', sortBy: 'name', sortOrder: 'asc', pageSize: 10 });
    await client.fetchQuery(list);
    await client.fetchQuery(options.detail(category.id));
    assert.equal(new URL(requests[0].url).searchParams.get('q'), 'shirt');
    assert.deepEqual(client.getQueryData(list.queryKey).data, [category]);
    assert.equal(client.getQueryData(categoryKeys.detail(category.id)).data.id, category.id);
    assert.notDeepEqual(list.queryKey, options.list({ q: 'shoes' }).queryKey);
    assert.equal(options.detail('').enabled, false);
  } finally {
    client.clear();
  }
});

test('category mutations invalidate all category lists/details but preserve unrelated cache', async () => {
  const requests = [];
  const { client, sdk } = fixture(async (request) => {
    requests.push(request);
    return Response.json({ data: category });
  });
  try {
    const listKey = categoryKeys.list({ q: 'shirt' });
    const detailKey = categoryKeys.detail(category.id);
    const orderKey = ['orders'];
    const mutations = categoryMutationOptions(sdk, client);
    for (const [options, variables, method] of [
      [mutations.create(), { name: 'Clothing', slug: 'clothing' }, 'POST'],
      [mutations.update(), { id: category.id, body: { name: 'New', slug: 'new' } }, 'PUT'],
      [mutations.remove(), category.id, 'DELETE'],
    ]) {
      for (const key of [listKey, detailKey, orderKey])
        client.setQueryData(key, { data: category });
      await new MutationObserver(client, options).mutate(variables);
      assert.equal(requests.at(-1).method, method);
      assert.equal(client.getQueryState(listKey).isInvalidated, true);
      assert.equal(client.getQueryState(detailKey).isInvalidated, true);
      assert.equal(client.getQueryState(orderKey).isInvalidated, false);
    }
  } finally {
    client.clear();
  }
});

test('failed mutation preserves field errors and cache without retrying', async () => {
  let calls = 0;
  const { client, sdk } = fixture(async () => {
    calls++;
    return Response.json(
      { message: 'Duplicate slug', extensions: { slug: ['Already used'] } },
      { status: 400 },
    );
  });
  try {
    const listKey = categoryKeys.list();
    client.setQueryData(listKey, { data: [category] });
    const options = categoryMutationOptions(sdk, client).create();
    await assert.rejects(
      new MutationObserver(client, options).mutate({ name: 'Test', slug: 'test' }),
      (error) => error instanceof ApiSdkError && getFieldError(error, 'slug') === 'Already used',
    );
    assert.equal(calls, 1);
    assert.equal(client.getQueryState(listKey).isInvalidated, false);
  } finally {
    client.clear();
  }
});

test('canceling a category query aborts the HTTP request', async () => {
  let requestStarted;
  const started = new Promise((resolve) => {
    requestStarted = resolve;
  });
  let aborted = false;
  const { client, sdk } = fixture(
    (request) =>
      new Promise((_resolve, reject) => {
        request.signal.addEventListener(
          'abort',
          () => {
            aborted = true;
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true },
        );
        requestStarted();
      }),
  );
  try {
    const options = categoryQueryOptions(sdk).list();
    const pending = client.fetchQuery(options);
    const rejection = assert.rejects(pending);
    await started;
    await client.cancelQueries({ queryKey: options.queryKey });
    await rejection;
    assert.equal(aborted, true);
  } finally {
    client.clear();
  }
});
