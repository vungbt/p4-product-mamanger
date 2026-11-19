import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { requestStore } from '@p4/server-core';
import { Op } from 'sequelize';
import { listVariants } from '../dist/modules/catalog/catalog.service.js';
import { parseVariantChanges } from '../dist/modules/catalog/variant-changes.js';
import { createProduct, updateProduct } from '../dist/modules/products/products.service.js';
import * as db from '../dist/sequelize/models/index.js';

function fixture(t) {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const rows = [];
  const files = ['first', 'second', 'foreign'].map((name) => ({
    id: randomUUID(),
    storageId: `uploads/${name}`,
    url: `https://example.com/${name}`,
    metadata: { purpose: 'product', ownerId: name === 'foreign' ? 'another-user' : 'actor' },
  }));
  const gallery = [];
  t.mock.method(db.FileModel, 'findByPk', async (id) => files.find((file) => file.id === id));
  t.mock.method(db.UploadTicketModel, 'findOne', async ({ where }) => {
    const file = files.find((file) => file.storageId === (where.id ?? where.storageId));
    if (
      !file ||
      file.metadata.ownerId !== where.ownerId ||
      (where.purpose && file.metadata.purpose !== where.purpose)
    )
      return null;
    return {
      id: file.storageId,
      ownerId: file.metadata.ownerId,
      status: 'completed',
      fileId: file.id,
      expiresAt: new Date(),
    };
  });
  t.mock.method(db.UploadTicketModel, 'findByPk', async (id) => ({
    id,
    ownerId: 'actor',
    status: 'completed',
    fileId: files.find((file) => file.storageId === id)?.id,
  }));
  t.mock.method(db.ProductImageModel, 'create', async (values) => {
    const image = { ...values, file: files.find((file) => file.id === values.fileId) };
    gallery.push(image);
    return image;
  });
  t.mock.method(db.ProductImageModel, 'destroy', async ({ where }) => {
    const kept = where.fileId?.[Op.notIn];
    for (let i = gallery.length - 1; i >= 0; i--)
      if (!kept?.includes(gallery[i].fileId)) gallery.splice(i, 1);
  });
  t.mock.method(db.ProductImageModel, 'findOrCreate', async ({ defaults }) => {
    const image = {
      ...defaults,
      file: files.find((file) => file.id === defaults.fileId),
      update: async () => {},
    };
    gallery.push(image);
    return [image, true];
  });
  const movements = [];
  const audits = [];
  let product;
  const attach = (row) => {
    row.update = async (values, options) => {
      assert.equal(options.transaction, transaction);
      row.set(values);
      return row;
    };
    return row;
  };
  t.mock.method(db.sequelize, 'transaction', async (options, work) =>
    typeof options === 'function' ? options(transaction) : work(transaction),
  );
  t.mock.method(db.ProductModel, 'create', async (values) => {
    product = attach(
      db.ProductModel.build({
        ...values,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    return product;
  });
  t.mock.method(db.ProductModel, 'findByPk', async () => product);
  t.mock.method(db.ProductModel, 'update', async (values, options) =>
    product.update(values, options),
  );
  t.mock.method(db.ProductImageModel, 'findAll', async () => [...gallery]);
  t.mock.method(db.ProductVariantModel, 'findByPk', async (id) =>
    rows.find((row) => row.id === id),
  );
  t.mock.method(db.DomainEventModel, 'create', async () => ({}));
  t.mock.method(db.ProductVariantModel, 'create', async (values, options) => {
    if (values.isDefault)
      assert.equal(
        rows.some((row) => row.isDefault),
        false,
        'unique default index',
      );
    assert.equal(options.transaction, transaction);
    const row = attach(db.ProductVariantModel.build(values));
    rows.push(row);
    return row;
  });
  t.mock.method(db.ProductVariantModel, 'findAll', async ({ where }) =>
    rows.filter(
      (row) => row.productId === where.productId && (!where.status || row.status === where.status),
    ),
  );
  t.mock.method(db.ProductVariantModel, 'findOne', async ({ where }) =>
    rows.find(
      (row) =>
        (!where.id || row.id !== where.id[Op.ne]) &&
        (where.sku
          ? row.sku === where.sku
          : where.barcode
            ? row.barcode === where.barcode
            : row.productId === where.productId &&
              row.size === where.size &&
              row.color === where.color),
    ),
  );
  t.mock.method(db.ProductVariantModel, 'update', async (values) => {
    for (const row of rows) row.set(values);
  });
  t.mock.method(db.OrderItemModel, 'count', async () => 0);
  t.mock.method(db.InventoryMovementModel, 'create', async (values, options) => {
    assert.equal(options.transaction, transaction);
    movements.push(values);
  });
  t.mock.method(db.AuditLogModel, 'create', async (values) => {
    audits.push(values);
  });
  return {
    rows,
    files,
    gallery,
    movements,
    audits,
    transaction,
    get product() {
      return product;
    },
  };
}
const variant = (size = 'M', color = 'red', extra = {}) => ({
  sku: `shirt-${size}-${color}`,
  size,
  color,
  price: 100,
  ...extra,
});
const input = (changes) => ({
  name: 'Shirt',
  slug: 'shirt',
  price: 100,
  stock: 0,
  description: '',
  variants: changes,
});
const field = (path, code) => (error) => {
  assert.equal(error.code, code);
  assert.ok(error.extensions[path]);
  return true;
};

test('matrix creates exactly its rows, records opening stock and ensures one active default', async (t) => {
  const f = fixture(t);
  const matrix = ['S', 'M'].flatMap((size) =>
    ['red', 'blue'].map((color) => variant(size, color, { stock: 3 })),
  );
  const product = await createProduct(input({ create: matrix }), f.transaction);
  assert.equal(f.rows.length, 4);
  assert.equal(product.version, 1);
  assert.equal(product.stock, 12);
  assert.equal(f.rows.filter((row) => row.isDefault).length, 1);
  assert.equal(f.movements.length, 4);
  assert.equal(f.audits.filter((row) => row.action === 'variant.created').length, 4);
});

test('omitting variants retains the legacy default SKU and opening balance', async (t) => {
  const f = fixture(t);
  const product = await createProduct({ ...input(undefined), stock: 2 }, f.transaction);
  assert.equal(f.rows.length, 1);
  assert.equal(f.rows[0].size, 'DEFAULT');
  assert.equal(f.rows[0].onHand, 2);
  assert.equal(product.version, 1);
});

test('update applies delete, update, create and bumps the parent exactly once', async (t) => {
  const f = fixture(t);
  await createProduct(input({ create: [variant('S'), variant('M')] }), f.transaction);
  const [small, medium] = f.rows;
  const product = await updateProduct(
    f.product.id,
    {
      expectedVersion: 1,
      variants: {
        delete: [small.id],
        update: [{ id: medium.id, expectedVersion: 1, price: 120 }],
        create: [variant('L', 'blue', { stock: 4 })],
      },
    },
    f.transaction,
  );
  assert.equal(product.version, 2);
  assert.equal(small.status, 'inactive');
  assert.equal(small.isDefault, false);
  assert.equal(medium.price, 120);
  assert.equal(f.rows.length, 3);
  assert.equal(f.rows.filter((row) => row.isDefault && row.status === 'active').length, 1);
  assert.equal(product.stock, 4);
});

for (const operation of ['delete', 'deactivate'])
  test(`${operation} rejects reserved SKUs with its row path`, async (t) => {
    const f = fixture(t);
    await createProduct(input({ create: [variant()] }), f.transaction);
    f.rows[0].reserved = 1;
    const changes =
      operation === 'delete'
        ? { delete: [f.rows[0].id] }
        : { update: [{ id: f.rows[0].id, status: 'inactive' }] };
    await assert.rejects(
      updateProduct(f.product.id, { variants: changes }, f.transaction),
      field(
        operation === 'delete' ? 'variants.delete.0' : 'variants.update.0.status',
        'variant_has_reservations',
      ),
    );
    assert.equal(f.rows[0].status, 'active');
  });

test('sold identity errors point at the changed cell and requested row', async (t) => {
  const f = fixture(t);
  await createProduct(input({ create: [variant()] }), f.transaction);
  t.mock.method(db.OrderItemModel, 'count', async () => 1);
  await assert.rejects(
    updateProduct(
      f.product.id,
      { variants: { update: [{ id: f.rows[0].id, size: 'L' }] } },
      f.transaction,
    ),
    field('variants.update.0.size', 'sold_variant_identity_immutable'),
  );
  assert.equal(f.rows[0].size, 'M');
});

for (const key of ['sku', 'barcode'])
  test(`duplicate ${key} identifies the matrix row`, async (t) => {
    const f = fixture(t);
    const first = variant('S', 'red', { barcode: '123' });
    const second = variant('M', 'blue', { [key]: first[key] });
    await assert.rejects(
      createProduct(input({ create: [first, second] }), f.transaction),
      field(`variants.create.1.${key}`, `duplicate_${key}`),
    );
  });

test('inactive defaults are cleared and the requested active default wins', async (t) => {
  const f = fixture(t);
  await createProduct(
    input({
      create: [
        variant('S', 'red', { isDefault: true }),
        variant('M', 'blue', { isDefault: true }),
        variant('L', 'red', { isDefault: true, status: 'inactive' }),
      ],
    }),
    f.transaction,
  );
  assert.deepEqual(
    f.rows.map((row) => row.isDefault),
    [false, true, false],
  );
});

test('nested validation rejects update stock, malformed inputs and overlapping operations', () => {
  const id = randomUUID();
  assert.equal(parseVariantChanges(undefined), undefined);
  assert.throws(
    () => parseVariantChanges({ update: [{ id, stock: 2 }] }),
    field('variants.update.0.stock', 'input_valid_error'),
  );
  assert.throws(
    () => parseVariantChanges({ create: [variant('M', 'red', { price: -1 })] }),
    field('variants.create.0.price', 'input_valid_error'),
  );
  assert.throws(
    () => parseVariantChanges({ update: [{ id }], delete: [id] }),
    field('variants', 'duplicate_variant_operation'),
  );
  assert.throws(
    () => parseVariantChanges({ update: [{ id }] }, true),
    field('variants', 'create_variants_only'),
  );
});

test('explicit empty matrix creates no fallback and deactivating the last active row clears defaults', async (t) => {
  const f = fixture(t);
  await createProduct(input({ create: [] }), f.transaction);
  assert.equal(f.rows.length, 0);
  await updateProduct(f.product.id, { variants: { create: [variant()] } }, f.transaction);
  await updateProduct(
    f.product.id,
    { variants: { update: [{ id: f.rows[0].id, status: 'inactive' }] } },
    f.transaction,
  );
  assert.equal(f.rows[0].isDefault, false);
});

test('duplicate combinations report an option cell rather than a SKU error', async (t) => {
  const f = fixture(t);
  await assert.rejects(
    createProduct(
      input({ create: [variant(), variant('M', 'red', { sku: 'CUSTOM' })] }),
      f.transaction,
    ),
    field('variants.create.1.size', 'duplicate_variant_combination'),
  );
});

const asActor = (work) =>
  requestStore.run({ requestId: 'variant-images', user: { id: 'actor' } }, work);

test('variant storage IDs resolve after same-request thumbnail and gallery writes, preserving order in responses', async (t) => {
  const f = fixture(t);
  const [first, second] = f.files;
  const changes = parseVariantChanges(
    { create: [variant('M', 'red', { imageStorageIds: [second.storageId, first.storageId] })] },
    true,
  );
  await asActor(() =>
    createProduct(
      {
        ...input(changes),
        thumbnailStorageId: first.storageId,
        imageStorageIds: [second.storageId],
      },
      f.transaction,
    ),
  );
  assert.deepEqual(f.rows[0].imageIds, [second.id, first.id]);
  const response = await listVariants(f.product.id, true);
  assert.deepEqual(
    response[0].images,
    [second, first].map(({ id: fileId, storageId, url }) => ({ fileId, storageId, url })),
  );
});

for (const operation of ['create', 'update']) {
  for (const storageId of ['uploads/foreign', 'unknown']) {
    test(`${operation} rejects unattached storage ID ${storageId} at its row path`, async (t) => {
      const f = fixture(t);
      await createProduct(input({ create: [variant()] }), f.transaction);
      const changes =
        operation === 'create'
          ? { create: [variant('L', 'red', { imageStorageIds: [storageId] })] }
          : { update: [{ id: f.rows[0].id, imageStorageIds: [storageId] }] };
      await assert.rejects(
        asActor(() => updateProduct(f.product.id, { variants: changes }, f.transaction)),
        field(`variants.${operation}.0.imageStorageIds`, 'invalid_product_image'),
      );
    });
  }
}

test('existing product attachments need no owner ticket and updates can clear SKU selections', async (t) => {
  const f = fixture(t);
  const [first, second] = f.files;
  await asActor(() =>
    createProduct(
      {
        ...input({ create: [variant()] }),
        thumbnailStorageId: first.storageId,
        imageStorageIds: [second.storageId],
      },
      f.transaction,
    ),
  );
  t.mock.method(db.UploadTicketModel, 'findOne', async () => {
    throw new Error('Existing attachment needs no ticket');
  });
  first.metadata.ownerId = 'another-user';
  await updateProduct(
    f.product.id,
    {
      variants: {
        update: [
          {
            id: f.rows[0].id,
            expectedVersion: 1,
            imageStorageIds: [second.storageId, first.storageId],
          },
        ],
      },
    },
    f.transaction,
  );
  assert.deepEqual(f.rows[0].imageIds, [second.id, first.id]);
  await updateProduct(
    f.product.id,
    { variants: { update: [{ id: f.rows[0].id, imageStorageIds: [] }] } },
    f.transaction,
  );
  assert.deepEqual(f.rows[0].imageIds, []);
});

test('detaching product images prunes every SKU in the same transaction, retaining order and thumbnail references', async (t) => {
  const f = fixture(t);
  const [first, second] = f.files;
  await asActor(() =>
    createProduct(
      {
        ...input({
          create: [
            variant('S', 'red', { imageStorageIds: [second.storageId, first.storageId] }),
            variant('M', 'red', { imageStorageIds: [first.storageId, second.storageId] }),
          ],
        }),
        thumbnailStorageId: first.storageId,
        imageStorageIds: [second.storageId],
      },
      f.transaction,
    ),
  );
  await updateProduct(f.product.id, { imageStorageIds: [] }, f.transaction);
  assert.deepEqual(
    f.rows.map((row) => row.imageIds),
    [[first.id], [first.id]],
  );
  await updateProduct(f.product.id, { thumbnailStorageId: null }, f.transaction);
  assert.deepEqual(
    f.rows.map((row) => row.imageIds),
    [[], []],
  );
});

test('a detached image cannot be reselected in the same product request', async (t) => {
  const f = fixture(t);
  const [first] = f.files;
  await asActor(() =>
    createProduct(
      { ...input({ create: [variant()] }), imageStorageIds: [first.storageId] },
      f.transaction,
    ),
  );
  await assert.rejects(
    asActor(() =>
      updateProduct(
        f.product.id,
        {
          imageStorageIds: [],
          variants: { update: [{ id: f.rows[0].id, imageStorageIds: [first.storageId] }] },
        },
        f.transaction,
      ),
    ),
    field('variants.update.0.imageStorageIds', 'invalid_product_image'),
  );
});

for (const operation of ['create', 'update']) {
  test(`${operation} accepts a new actor upload only on the SKU and preserves it across gallery changes`, async (t) => {
    const f = fixture(t);
    const [first, second] = f.files;
    await asActor(() =>
      createProduct(
        {
          ...input({
            create: [
              variant(
                'M',
                'red',
                operation === 'create' ? { imageStorageIds: [second.storageId] } : {},
              ),
            ],
          }),
          imageStorageIds: [first.storageId],
        },
        f.transaction,
      ),
    );
    if (operation === 'update')
      await asActor(() =>
        updateProduct(
          f.product.id,
          {
            variants: {
              update: [{ id: f.rows[0].id, imageStorageIds: [second.storageId, first.storageId] }],
            },
          },
          f.transaction,
        ),
      );
    assert.ok(f.rows[0].imageIds.includes(second.id));
    assert.deepEqual(
      f.gallery.map((image) => image.fileId),
      [first.id],
    );
    await updateProduct(f.product.id, { imageStorageIds: [] }, f.transaction);
    assert.deepEqual(f.rows[0].imageIds, [second.id]);
    second.metadata.ownerId = 'another-user';
    await updateProduct(
      f.product.id,
      { variants: { update: [{ id: f.rows[0].id, imageStorageIds: [second.storageId] }] } },
      f.transaction,
    );
    assert.deepEqual(f.rows[0].imageIds, [second.id]);
  });
}

for (const metadata of [{ ownerId: 'another-user' }, { purpose: 'avatar' }, { private: true }]) {
  test(`SKU upload rejects invalid metadata ${JSON.stringify(metadata)}`, async (t) => {
    const f = fixture(t);
    Object.assign(f.files[0].metadata, metadata);
    await assert.rejects(
      asActor(() =>
        createProduct(
          input({ create: [variant('M', 'red', { imageStorageIds: [f.files[0].storageId] })] }),
          f.transaction,
        ),
      ),
      field('variants.create.0.imageStorageIds', 'invalid_product_image'),
    );
  });
}
