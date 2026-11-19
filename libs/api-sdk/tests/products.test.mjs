import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import {
  getAdminProductsQueryOptions,
  getAdminSizeGuidesQueryOptions,
  getCategoriesQueryOptions,
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
    thumbnailStorageId: 'verified-cover',
    imageStorageIds: ['verified-gallery'],
  });
  assert.equal((await requests.at(-1).json()).thumbnailStorageId, 'verified-cover');
  await api.update({ id: 'p', body: { name: 'New', expectedVersion: 3 } });
  assert.deepEqual(await requests.at(-1).json(), { name: 'New', expectedVersion: 3 });
  await api.update({ id: 'p', body: { thumbnailStorageId: null, expectedVersion: 4 } });
  assert.equal(requests.at(-1).method, 'PATCH');
  assert.deepEqual(await requests.at(-1).json(), { thumbnailStorageId: null, expectedVersion: 4 });
  await api.update({
    id: 'p',
    body: { thumbnailStorageId: 'existing-gallery', imageStorageIds: ['old-cover', 'new-upload'] },
  });
  assert.deepEqual(await requests.at(-1).json(), {
    thumbnailStorageId: 'existing-gallery',
    imageStorageIds: ['old-cover', 'new-upload'],
  });
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
  await api.addImage({ id: 'p', body: { storageId: 'verified-image', sortOrder: 1 } });
  assert.deepEqual(await requests.at(-1).json(), {
    storageId: 'verified-image',
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
    const unrelated = [
      ['unrelated'],
      ['categories', 'list'],
      getCategoriesQueryOptions(sdk).queryKey,
      getAdminSizeGuidesQueryOptions(sdk).queryKey,
    ];
    for (const key of unrelated) client.setQueryData(key, 1);
    const observer = new MutationObserver(
      client,
      productMutationOptions(sdk, client).updateVariant(),
    );
    await observer.mutate({ id: 'p', variantId: 'sku', body: { price: 200, expectedVersion: 2 } });
    for (const key of keys) assert.equal(client.getQueryState(key).isInvalidated, true);
    for (const key of unrelated) assert.equal(client.getQueryState(key).isInvalidated, false);
  } finally {
    client.clear();
  }
});

test('product commands send the complete variant diff in one request and preserve row errors', async () => {
  const requests = [];
  const sdk = createApiSdk({
    baseUrl: 'https://example.invalid',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(
        { code: 'duplicate_sku', extensions: { 'variants.create.1.sku': ['Already used.'] } },
        { status: 409 },
      );
    },
  });
  const body = {
    expectedVersion: 7,
    variants: {
      create: [{ sku: 'SHIRT-S-RED', size: 'S', color: 'red', price: 100, stock: 5 }],
      update: [{ id: 'existing', expectedVersion: 2, price: 120 }],
      delete: ['removed'],
    },
  };
  await assert.rejects(createProductApi(sdk).update({ id: 'p', body }), (error) => {
    assert.equal(error.fieldErrors['variants.create.1.sku'][0], 'Already used.');
    return true;
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'PATCH');
  assert.equal(new URL(requests[0].url).pathname, '/api/products/p');
  assert.deepEqual(await requests[0].json(), body);
});

test('product request carries ordered SKU storage IDs alongside new uploads and preserves image row errors', async () => {
  const requests = [];
  let fail = false;
  const sdk = createApiSdk({
    baseUrl: 'https://example.invalid',
    fetch: async (request) => {
      requests.push(request);
      return fail
        ? Response.json(
            {
              code: 'invalid_product_image',
              extensions: { 'variants.update.0.imageStorageIds': ['invalid_product_image'] },
            },
            { status: 422 },
          )
        : Response.json({ data: { id: 'product' } });
    },
  });
  const api = createProductApi(sdk);
  const body = {
    thumbnailStorageId: 'new-cover',
    imageStorageIds: ['new-gallery'],
    variants: {
      create: [
        {
          sku: 'NEW-M-RED',
          size: 'M',
          color: 'red',
          price: 100,
          imageStorageIds: ['new-gallery', 'new-cover'],
        },
      ],
    },
  };
  await api.create({ name: 'New', price: 100, stock: 0, ...body });
  assert.deepEqual((await requests.at(-1).json()).variants, body.variants);
  await api.update({
    id: 'product',
    body: { variants: { update: [{ id: 'variant', expectedVersion: 2, imageStorageIds: [] }] } },
  });
  assert.deepEqual(await requests.at(-1).json(), {
    variants: { update: [{ id: 'variant', expectedVersion: 2, imageStorageIds: [] }] },
  });
  fail = true;
  await assert.rejects(
    api.update({
      id: 'product',
      body: { variants: { update: [{ id: 'variant', imageStorageIds: ['foreign'] }] } },
    }),
    (error) =>
      error.status === 422 &&
      error.fieldErrors['variants.update.0.imageStorageIds'][0] === 'invalid_product_image',
  );
});
