import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestStore } from '@p4/server-core';
import {
  addProductImage,
  createProduct,
  removeProductImage,
  updateProduct,
} from '../dist/modules/products/products.service.js';
import * as db from '../dist/sequelize/models/index.js';

// Exercise the real service and DTO with database/provider boundaries replaced.
// Existing product attachments can move between thumbnail and ordered gallery.
function fixture(t) {
  const now = new Date();
  const row = db.ProductModel.build({
    id: 'product',
    name: 'Shirt',
    slug: 'shirt',
    status: 'draft',
    price: 100,
    description: '',
    stock: 0,
    thumbnailId: 'first',
    version: 1,
    createdAt: now,
    updatedAt: now,
  });
  const files = [
    { id: 'first', storageId: 'seed/first', url: 'https://example.com/first' },
    { id: 'second', storageId: 'foreign/second', url: 'https://example.com/second' },
    { id: 'new', storageId: 'actor/new', url: 'https://example.com/new' },
  ];
  const gallery = files.slice(0, 2).map((file, index) => ({
    id: `gallery-${index}`,
    productId: row.id,
    fileId: file.id,
    sortOrder: index + 7,
    file,
  }));
  row.gallery = gallery;
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  t.mock.method(db.sequelize, 'transaction', async (options, work) =>
    typeof options === 'function' ? options(transaction) : work(transaction),
  );
  t.mock.method(row, 'update', async (values) => {
    row.set(values);
    return row;
  });
  t.mock.method(db.ProductModel, 'findByPk', async () => {
    row.thumbnail = files.find((file) => file.id === row.thumbnailId) ?? null;
    return row;
  });
  t.mock.method(db.ProductImageModel, 'findOne', async ({ where, include }) => {
    assert.equal(where.productId, row.id);
    return gallery.find((image) => image.file.storageId === include[0].where.storageId) ?? null;
  });
  t.mock.method(db.ProductImageModel, 'findAll', async () => [...gallery]);
  t.mock.method(db.ProductVariantModel, 'findAll', async () => []);
  t.mock.method(db.ProductImageModel, 'destroy', async ({ where, transaction: tx }) => {
    assert.equal(tx, transaction);
    const { Op } = await import('sequelize');
    const kept = where.fileId?.[Op.notIn];
    for (let i = gallery.length - 1; i >= 0; i--) {
      if (
        !where.fileId ||
        (kept ? !kept.includes(gallery[i].fileId) : gallery[i].fileId === where.fileId)
      )
        gallery.splice(i, 1);
    }
  });
  const updateImage = (image) => {
    image.update = async (values, { transaction: tx }) => {
      assert.equal(tx, transaction);
      Object.assign(image, values);
      return image;
    };
    return image;
  };
  gallery.forEach(updateImage);
  t.mock.method(db.ProductImageModel, 'max', async () =>
    Math.max(-1, ...gallery.map((i) => i.sortOrder)),
  );
  t.mock.method(db.ProductImageModel, 'findOrCreate', async ({ defaults }) => {
    const found = gallery.find((image) => image.fileId === defaults.fileId);
    if (found) return [found, false];
    const image = {
      ...defaults,
      id: 'added',
      file: files.find((file) => file.id === defaults.fileId),
    };
    updateImage(image);
    gallery.push(image);
    return [image, true];
  });
  t.mock.method(db.AuditLogModel, 'create', async () => ({}));
  // A seed image or another uploader's gallery image must never reach this boundary.
  const tickets = t.mock.method(db.UploadTicketModel, 'findOne', async ({ where }) => {
    assert.equal(where.ownerId, 'actor');
    if (where.id)
      return { id: where.id, ownerId: 'actor', status: 'completed', fileId: 'new', expiresAt: now };
    assert.equal(where.purpose, 'product');
    if (where.storageId !== 'actor/new') return null;
    return { id: 'ticket' };
  });
  t.mock.method(db.UploadTicketModel, 'findByPk', async () => ({
    id: 'ticket',
    ownerId: 'actor',
    purpose: 'product',
    status: 'completed',
    fileId: 'new',
    expiresAt: now,
  }));
  t.mock.method(db.FileModel, 'findByPk', async (id) => files.find((file) => file.id === id));
  return { row, gallery, transaction, tickets, files };
}

for (const storageId of ['seed/first', 'foreign/second']) {
  test(`attached file ${storageId} can become thumbnail without an upload ticket`, async (t) => {
    const { row, transaction, tickets } = fixture(t);
    const dto = await updateProduct(row.id, { thumbnailStorageId: storageId }, transaction);
    assert.equal(dto.thumbnail.storageId, storageId);
    assert.ok(dto.images.every((image) => image.storageId !== storageId));
    assert.equal(tickets.mock.callCount(), 0);
    assert.equal(dto.version, 2);
  });
}

test('complete gallery reorders existing files and removes omitted images', async (t) => {
  const { row, transaction, tickets } = fixture(t);
  let dto = await updateProduct(
    row.id,
    {
      thumbnailStorageId: null,
      imageStorageIds: ['foreign/second', 'seed/first'],
    },
    transaction,
  );
  assert.deepEqual(
    dto.images.map((image) => [image.storageId, image.sortOrder]),
    [
      ['foreign/second', 0],
      ['seed/first', 1],
    ],
  );
  dto = await updateProduct(row.id, { imageStorageIds: ['seed/first'] }, transaction);
  assert.deepEqual(
    dto.images.map((image) => image.storageId),
    ['seed/first'],
  );
  dto = await updateProduct(row.id, { imageStorageIds: [] }, transaction);
  assert.deepEqual(dto.images, []);
  assert.equal(tickets.mock.callCount(), 0);
});

test('thumbnail and gallery swap in one audited update with one version bump', async (t) => {
  const { row, transaction, tickets } = fixture(t);
  const dto = await updateProduct(
    row.id,
    {
      thumbnailStorageId: 'foreign/second',
      imageStorageIds: ['seed/first', 'foreign/second'],
      expectedVersion: 1,
    },
    transaction,
  );
  assert.equal(dto.thumbnail.fileId, 'second');
  assert.deepEqual(
    dto.images.map((image) => [image.fileId, image.sortOrder]),
    [['first', 0]],
  );
  assert.equal(dto.version, 2);
  assert.equal(row.update.mock.callCount(), 1);
  assert.equal(db.AuditLogModel.create.mock.callCount(), 1);
  assert.equal(db.AuditLogModel.create.mock.calls[0].arguments[1].transaction, transaction);
  assert.equal(tickets.mock.callCount(), 0);
});

test('current thumbnail can move into gallery after its old gallery reference is gone', async (t) => {
  const { row, gallery, transaction, tickets } = fixture(t);
  gallery.splice(0, 1);
  const dto = await updateProduct(
    row.id,
    {
      thumbnailStorageId: 'foreign/second',
      imageStorageIds: ['seed/first'],
    },
    transaction,
  );
  assert.equal(dto.thumbnail.fileId, 'second');
  assert.deepEqual(
    dto.images.map((image) => image.fileId),
    ['first'],
  );
  assert.equal(tickets.mock.callCount(), 0);
});

for (const field of ['thumbnailStorageId', 'imageStorageIds']) {
  test(`foreign storage ID rejected for ${field} before product mutation`, async (t) => {
    const { row, transaction } = fixture(t);
    await assert.rejects(
      requestStore.run({ requestId: 'test', user: { id: 'actor' } }, () =>
        updateProduct(
          row.id,
          {
            [field]:
              field === 'imageStorageIds' ? ['foreign/not-in-product'] : 'foreign/not-in-product',
          },
          transaction,
        ),
      ),
    );
    assert.equal(row.update.mock.callCount(), 0);
  });
}

test('clearing the thumbnail preserves gallery and falls back only for display', async (t) => {
  const { row, transaction, tickets } = fixture(t);
  const dto = await updateProduct(row.id, { thumbnailStorageId: null }, transaction);
  assert.equal(dto.thumbnailId, null);
  assert.equal(dto.thumbnail, null);
  assert.equal(dto.thumbnailUrl, 'https://example.com/first');
  assert.deepEqual(
    dto.images.map((image) => image.fileId),
    ['first', 'second'],
  );
  assert.equal(tickets.mock.callCount(), 0);
  const unchanged = await updateProduct(row.id, { name: 'Updated' }, transaction);
  assert.equal(unchanged.thumbnail, null);
});

test('new thumbnail upload requires an owned ticket and stays outside gallery', async (t) => {
  const { row, transaction, tickets } = fixture(t);
  const dto = await requestStore.run({ requestId: 'test', user: { id: 'actor' } }, () =>
    updateProduct(row.id, { thumbnailStorageId: 'actor/new', expectedVersion: 1 }, transaction),
  );
  assert.equal(tickets.mock.callCount(), 2);
  assert.equal(dto.thumbnail.fileId, 'new');
  assert.deepEqual(
    dto.images.map((image) => image.sortOrder),
    [7, 8],
  );
  assert.ok(dto.images.every((image) => image.fileId !== 'new'));
});

test('a file outside the product gallery cannot bypass upload ownership', async (t) => {
  const { row, transaction } = fixture(t);
  await assert.rejects(
    requestStore.run({ requestId: 'test', user: { id: 'actor' } }, () =>
      updateProduct(row.id, { thumbnailStorageId: 'foreign/not-in-product' }, transaction),
    ),
  );
  assert.equal(row.update.mock.callCount(), 0);
});

test('stale version fails before touching thumbnail uploads', async (t) => {
  const { row, transaction, tickets } = fixture(t);
  await assert.rejects(
    updateProduct(row.id, { thumbnailStorageId: 'actor/new', expectedVersion: 2 }, transaction),
  );
  assert.equal(tickets.mock.callCount(), 0);
  assert.equal(row.update.mock.callCount(), 0);
});

for (const picked of [false, true]) {
  test(`create ${picked ? 'sets an independent thumbnail' : 'leaves thumbnail empty'} without reordering images`, async (t) => {
    const { row, gallery, transaction } = fixture(t);
    // Creation uses only completed owned upload tickets.
    gallery.length = 0;
    const createdImages = [];
    t.mock.method(db.UploadTicketModel, 'findOne', async ({ where }) =>
      where.id
        ? {
            id: where.id,
            ownerId: 'actor',
            status: 'completed',
            fileId:
              where.id === 'seed/first' ? 'first' : where.id === 'actor/new' ? 'new' : 'second',
            expiresAt: new Date(),
          }
        : { id: where.storageId },
    );
    t.mock.method(db.UploadTicketModel, 'findByPk', async (id) => ({
      id,
      ownerId: 'actor',
      status: 'completed',
      fileId: id === 'seed/first' ? 'first' : id === 'actor/new' ? 'new' : 'second',
    }));
    t.mock.method(db.ProductModel, 'create', async (values) => {
      row.set(values);
      return row;
    });
    t.mock.method(db.ProductImageModel, 'create', async (values) => {
      createdImages.push(values);
      return values;
    });
    t.mock.method(db.ProductVariantModel, 'create', async () => ({ id: 'variant' }));
    t.mock.method(db.InventoryMovementModel, 'create', async () => ({}));
    await requestStore.run({ requestId: 'test', user: { id: 'actor' } }, () =>
      createProduct(
        {
          name: 'Shirt',
          slug: 'shirt',
          description: '',
          price: 100,
          stock: 0,
          imageStorageIds: ['seed/first', 'foreign/second'],
          ...(picked ? { thumbnailStorageId: 'actor/new' } : {}),
        },
        transaction,
      ),
    );
    assert.equal(row.thumbnailId, picked ? 'new' : null);
    assert.deepEqual(
      createdImages.map(({ fileId, sortOrder }) => ({ fileId, sortOrder })),
      [
        { fileId: 'first', sortOrder: 0 },
        { fileId: 'second', sortOrder: 1 },
      ],
    );
  });
}

for (const [thumbnailRefs, galleryRefs] of [
  [1, 0],
  [0, 2],
  [1, 2],
]) {
  test(`file references count thumbnail=${thumbnailRefs} and gallery=${galleryRefs}`, async (t) => {
    const { countFileReferences } = await import('../dist/modules/files/files.service.js');
    t.mock.method(db.ProductModel, 'count', async ({ where }) => {
      assert.equal(where.thumbnailId, 'file');
      return thumbnailRefs;
    });
    t.mock.method(db.ProductImageModel, 'count', async ({ where }) => {
      assert.equal(where.fileId, 'file');
      return galleryRefs;
    });
    for (const model of [db.UserModel, db.ProductVariantModel, db.ReturnRequestModel])
      t.mock.method(model, 'count', async () => 0);
    t.mock.method(db.sequelize, 'query', async () => [{ count: 0 }]);
    assert.equal(await countFileReferences('file'), thumbnailRefs + galleryRefs);
  });
}

test('adding a gallery image leaves an empty thumbnail unset', async (t) => {
  const { row, files } = fixture(t);
  row.thumbnailId = null;
  const image = { id: 'added', fileId: 'new', sortOrder: 9, file: files[2] };
  t.mock.method(db.ProductImageModel, 'create', async () => image);
  t.mock.method(db.ProductImageModel, 'findByPk', async () => image);
  await requestStore.run({ requestId: 'test', user: { id: 'actor' } }, () =>
    addProductImage(row.id, { storageId: 'actor/new' }),
  );
  assert.equal(row.thumbnailId, null);
  assert.equal(row.update.mock.callCount(), 0);
});

test('removing a gallery reference preserves the same file used as thumbnail', async (t) => {
  const { row, gallery } = fixture(t);
  const image = gallery[0];
  image.destroy = async () => {};
  t.mock.method(db.ProductImageModel, 'findOne', async () => image);
  t.mock.method(db.ProductModel, 'count', async () => 1);
  for (const model of [
    db.ProductImageModel,
    db.UserModel,
    db.ProductVariantModel,
    db.ReturnRequestModel,
  ])
    t.mock.method(model, 'count', async () => 0);
  t.mock.method(db.sequelize, 'query', async () => [{ count: 0 }]);
  const destroyFile = t.mock.method(db.FileModel, 'findByPk', async () => {
    throw new Error('Referenced file must not be deleted');
  });
  await removeProductImage(row.id, image.id);
  assert.equal(row.thumbnailId, 'first');
  assert.equal(row.update.mock.callCount(), 0);
  assert.equal(destroyFile.mock.callCount(), 0);
});
