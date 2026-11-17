import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import {
  getAdminProductsQueryOptions,
  getProductsQueryOptions,
  productKeys,
  productMutationOptions,
  productQueryOptions,
} from '../dist/react/index.js';
import { ApiSdkError, createApiSdk, createProductApi } from '../dist/shared/index.js';

test('product resource and generated hooks share keys without mixing admin/storefront or filters', async () => {
  const sdk = createApiSdk({
    baseUrl: 'https://example.invalid',
    fetch: async () => Response.json({ data: [] }),
  });
  const query = { page: 2, pageSize: 10, categoryId: 'cat', sortBy: 'stock', sortOrder: 'desc' };
  const options = productQueryOptions(sdk);
  assert.deepEqual(
    options.list(query).queryKey,
    getAdminProductsQueryOptions(sdk, { params: { query } }).queryKey,
  );
  assert.deepEqual(options.list(query).queryKey, productKeys.list(query));
  assert.deepEqual(options.detail('p').queryKey, productKeys.detail('p'));
  assert.deepEqual(options.variants('p').queryKey, productKeys.variants('p'));
  assert.deepEqual(options.bySlug('shirt').queryKey, productKeys.bySlug('shirt'));
  assert.deepEqual(
    options.storefrontList(query).queryKey,
    getProductsQueryOptions(sdk, { params: { query } }).queryKey,
  );
  assert.notDeepEqual(options.storefrontList(query).queryKey, options.list(query).queryKey);
  assert.notDeepEqual(options.list(query).queryKey, options.list({ ...query, page: 1 }).queryKey);
  assert.equal(options.detail('').enabled, false);
  assert.equal(options.variants('').enabled, false);
  assert.equal(options.bySlug('').enabled, false);
});

test('product commands preserve storage IDs, partial updates, versions, SKU/image paths and API errors', async () => {
  const requests = [];
  let fail = false;
  const sdk = createApiSdk({
    baseUrl: 'https://example.invalid',
    fetch: async (req) => {
      requests.push(req);
      return fail
        ? Response.json(
            {
              code: 'product_incomplete',
              extensions: { publication: ['An active SKU is required.'] },
            },
            { status: 409 },
          )
        : Response.json({ data: { id: 'p' } });
    },
  });
  const api = createProductApi(sdk);
  await api.create({
    name: 'Shirt',
    price: 100,
    stock: 0,
    imageStorageId: 'verified-cover',
    imageStorageIds: ['verified-gallery'],
  });
  assert.equal((await requests.at(-1).json()).imageStorageId, 'verified-cover');
  await api.update({ id: 'p', body: { name: 'New', expectedVersion: 3 } });
  assert.deepEqual(await requests.at(-1).json(), { name: 'New', expectedVersion: 3 });
  await api.updatePublication({ id: 'p', body: { status: 'archived', expectedVersion: 4 } });
  assert.equal(requests.at(-1).method, 'PATCH');
  assert.equal(new URL(requests.at(-1).url).pathname, '/api/products/p/publication');
  assert.deepEqual(await requests.at(-1).json(), { status: 'archived', expectedVersion: 4 });
  await api.updateVariant({ id: 'p', variantId: 'sku', body: { price: 200, expectedVersion: 2 } });
  assert.equal(new URL(requests.at(-1).url).pathname, '/api/products/p/variants/sku');
  await api.updateVariantImages({
    id: 'p',
    variantId: 'sku',
    body: { imageIds: ['file'], expectedVersion: 3 },
  });
  assert.equal(new URL(requests.at(-1).url).pathname, '/api/products/p/variants/sku/images');
  await api.addImage({ id: 'p', body: { imageStorageId: 'verified-image', sortOrder: 1 } });
  assert.deepEqual(await requests.at(-1).json(), {
    imageStorageId: 'verified-image',
    sortOrder: 1,
  });
  await api.removeImage({ id: 'p', imageId: 'image' });
  assert.equal(requests.at(-1).method, 'DELETE');
  assert.equal(new URL(requests.at(-1).url).pathname, '/api/products/p/images/image');
  fail = true;
  await assert.rejects(
    api.updatePublication({ id: 'p', body: { status: 'active', expectedVersion: 5 } }),
    (error) =>
      error instanceof ApiSdkError &&
      error.code === 'product_incomplete' &&
      error.fieldErrors.publication[0] === 'An active SKU is required.',
  );
});

test('product mutations refresh generated and resource product lists/details/variants together', async () => {
  const sdk = createApiSdk({
    baseUrl: 'https://example.invalid',
    fetch: async () => Response.json({ data: {} }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  try {
    const keys = [
      productKeys.list({ page: 1 }),
      productKeys.detail('p'),
      productKeys.variants('p'),
      productKeys.storefrontDetail('p'),
    ];
    for (const key of keys) client.setQueryData(key, { data: [] });
    client.setQueryData(['unrelated'], 1);
    const observer = new MutationObserver(
      client,
      productMutationOptions(sdk, client).updateVariant(),
    );
    await observer.mutate({ id: 'p', variantId: 'sku', body: { price: 200, expectedVersion: 2 } });
    for (const key of keys) assert.equal(client.getQueryState(key).isInvalidated, true);
    assert.equal(client.getQueryState(['unrelated']).isInvalidated, false);
  } finally {
    client.clear();
  }
});
