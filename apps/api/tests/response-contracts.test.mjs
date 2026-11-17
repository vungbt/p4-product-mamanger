import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import YAML from 'yaml';
import { cartSnapshot } from '../dist/modules/cart/cart.service.js';
import { exchangeDto } from '../dist/modules/exchanges/exchanges.service.js';
import { cancellationDto } from '../dist/modules/orders/order-lifecycle.service.js';
import { productDto } from '../dist/modules/products/products.service.js';
import { refundDto } from '../dist/modules/refunds/refund-processing.service.js';
import { toRefund } from '../dist/modules/refunds/refunds.service.js';
import { returnDto } from '../dist/modules/returns/returns.service.js';
import { messageDto, ticketDto } from '../dist/modules/support/support.service.js';
import * as db from '../dist/sequelize/models/index.js';

const date = new Date('2026-11-17T01:00:00Z');
const productValues = {
  id: 'product',
  name: 'Shirt',
  slug: 'shirt',
  status: 'active',
  price: 100,
  stock: 4,
  description: 'Cotton shirt',
  brand: 'Brand',
  material: 'Cotton',
  careInstructions: 'Cold wash',
  seoTitle: 'Shirt',
  seoDescription: 'SEO',
  sizeGuideId: null,
  version: 3,
  imageId: 'cover',
  categoryId: 'cat',
  createdAt: date,
  updatedAt: date,
};

test('product DTO consistently returns catalog metadata, category, cover and sorted gallery', () => {
  const row = db.ProductModel.build(productValues);
  row.image = db.FileModel.build({ id: 'cover', url: 'https://images.example/cover' });
  row.category = db.CategoryModel.build({
    id: 'cat',
    name: 'Clothes',
    slug: 'clothes',
    description: 'Category',
  });
  row.gallery = [
    { id: 'second', fileId: 'f2', sortOrder: 2, file: { url: 'https://images.example/2' } },
    { id: 'first', fileId: 'f1', sortOrder: 1, file: { url: 'https://images.example/1' } },
  ];
  const dto = productDto(row);
  for (const key of [
    'slug',
    'status',
    'brand',
    'material',
    'careInstructions',
    'seoTitle',
    'seoDescription',
    'sizeGuideId',
    'version',
    'imageId',
    'categoryId',
  ])
    assert.equal(dto[key], productValues[key], key);
  assert.equal(dto.imageUrl, 'https://images.example/cover');
  assert.equal(dto.category.slug, 'clothes');
  assert.deepEqual(
    dto.images.map((image) => image.fileId),
    ['f1', 'f2'],
  );
  assert.equal(dto.createdAt, date.toISOString());
  assert.equal(dto.updatedAt, date.toISOString());
  row.image = null;
  assert.equal(productDto(row).imageUrl, 'https://images.example/1');
  assert.equal('_previousDataValues' in dto, false);
});

test('support and aftersales DTOs retain owner, author and resource references', () => {
  const ticket = ticketDto(
    db.SupportTicketModel.build({
      id: 'ticket',
      userId: 'customer',
      orderId: 'order',
      subject: 'Help',
      category: 'order',
      status: 'open',
      assigneeId: null,
      version: 2,
      createdAt: date,
    }),
  );
  assert.equal(ticket.userId, 'customer');
  assert.equal(ticket.version, 2);
  const message = messageDto(
    db.SupportMessageModel.build({
      id: 'message',
      ticketId: 'ticket',
      authorId: 'agent',
      body: 'Answer',
      internal: false,
      attachmentIds: ['file'],
      createdAt: date,
    }),
  );
  assert.equal(message.ticketId, 'ticket');
  assert.equal(message.authorId, 'agent');
  for (const [model, dto] of [
    [db.ReturnRequestModel, returnDto],
    [db.CancellationRequestModel, cancellationDto],
    [db.ExchangeRequestModel, exchangeDto],
  ]) {
    const value = dto(
      model.build({
        id: 'request',
        userId: 'customer',
        orderId: 'order',
        status: 'requested',
        reason: 'Reason',
        version: 2,
        createdAt: date,
      }),
    );
    assert.equal(value.userId, 'customer');
    assert.equal(value.orderId, 'order');
    assert.equal(value.version, 2);
  }
});

test('refund list and detail expose the same reconciliation and version fields', () => {
  const values = {
    id: 'refund',
    orderId: 'order',
    paymentId: 'payment',
    amount: 100,
    status: 'pending',
    reason: 'Reason',
    attemptId: 'attempt',
    externalId: 'external',
    manualReference: 'manual',
    returnId: 'return',
    processingStatus: 'processing',
    attemptNumber: 2,
    version: 4,
    createdAt: date,
  };
  const row = db.RefundModel.build(values);
  const list = toRefund(row);
  assert.deepEqual(list, refundDto(row));
  for (const key of [
    'paymentId',
    'attemptId',
    'externalId',
    'manualReference',
    'returnId',
    'processingStatus',
    'attemptNumber',
    'version',
  ])
    assert.equal(list[key], values[key], key);
});

test('cart snapshot adds product link and public variant image with bounded batch reads', async () => {
  const patches = [];
  const stub = (target, key, value) => {
    patches.push([target, key, target[key]]);
    target[key] = value;
  };
  let imageReads = 0;
  stub(db.CartItemModel, 'findAll', async () => [
    { id: 'line', variantId: 'sku', quantity: 1, addedPrice: 100 },
  ]);
  stub(db.ProductVariantModel, 'findAll', async () => [
    {
      id: 'sku',
      productId: 'product',
      sku: 'SKU',
      size: 'M',
      color: 'blue',
      status: 'active',
      onHand: 4,
      reserved: 1,
      price: 100,
      imageIds: ['variant-image'],
    },
  ]);
  stub(db.ProductModel, 'findAll', async () => [{ ...productValues }]);
  stub(db.FileModel, 'findAll', async () => {
    imageReads++;
    return [
      { id: 'variant-image', url: 'https://images.example/sku', metadata: { private: false } },
      { id: 'cover', url: 'https://images.example/cover', metadata: { private: false } },
    ];
  });
  stub(db.ShopSettingsModel, 'findByPk', async () => ({ currency: 'VND' }));
  try {
    const result = await cartSnapshot({ id: 'cart', version: 1 });
    assert.equal(result.items[0].productSlug, 'shirt');
    assert.equal(result.items[0].imageUrl, 'https://images.example/sku');
    assert.equal(result.items[0].available, 3);
    assert.equal(result.subtotal, 100);
    assert.equal(imageReads, 1);
    stub(db.FileModel, 'findAll', async () => [
      { id: 'variant-image', url: 'https://private.example', metadata: { private: true } },
      { id: 'cover', url: 'https://images.example/cover', metadata: {} },
    ]);
    assert.equal(
      (await cartSnapshot({ id: 'cart', version: 1 })).items[0].imageUrl,
      'https://images.example/cover',
    );
  } finally {
    for (const [target, key, value] of patches.reverse()) target[key] = value;
  }
});

test('OpenAPI distinguishes signed URL JSON from byte downloads and declares full product fields', async () => {
  const spec = YAML.parse(await readFile(new URL('../openapi.yaml', import.meta.url), 'utf8'));
  const signed = spec.paths['/api/files/{id}/download'].get.responses['200'].content;
  assert.ok(signed['application/json']);
  assert.equal(signed['application/octet-stream'], undefined);
  for (const path of ['/api/processes/{id}/download', '/api/admin/report-exports/{id}/download'])
    assert.ok(spec.paths[path].get.responses['200'].content['application/octet-stream']);
  const resolve = (schema) =>
    schema.$ref ? spec.components.schemas[schema.$ref.split('/').at(-1)] : schema;
  for (const path of ['/api/products', '/api/admin/products']) {
    const envelope = resolve(
      spec.paths[path].get.responses['200'].content['application/json'].schema,
    );
    const product = resolve(resolve(envelope.properties.data).items);
    for (const key of [
      'slug',
      'status',
      'version',
      'brand',
      'material',
      'seoTitle',
      'images',
      'imageUrl',
    ])
      assert.ok(product.properties[key], `${path}: ${key}`);
  }
});

test('published content and shop resolve renderable URLs without private file metadata', async () => {
  const { withContentMedia } = await import('../dist/modules/content/content.service.js');
  const { shopDto } = await import('../dist/modules/settings/settings.service.js');
  const originalFindAll = db.FileModel.findAll,
    originalFindByPk = db.FileModel.findByPk;
  let batches = 0;
  db.FileModel.findAll = async () => {
    batches++;
    return [
      {
        id: 'cover',
        url: 'https://images.example/cover',
        metadata: { private: false, ownerId: 'hidden-owner' },
      },
      { id: 'private', url: 'https://private.example', metadata: { private: true } },
    ];
  };
  db.FileModel.findByPk = async () => ({
    url: 'https://images.example/logo',
    metadata: { private: false },
  });
  try {
    const [entry] = await withContentMedia([
      {
        slug: 'post',
        coverFileId: 'cover',
        body: [
          { type: 'image', fileId: 'private', alt: 'Private' },
          { type: 'image', fileId: 'cover', alt: 'Public' },
        ],
      },
    ]);
    assert.equal(batches, 1);
    assert.equal(entry.coverUrl, 'https://images.example/cover');
    assert.deepEqual(entry.media, [{ id: 'cover', url: 'https://images.example/cover' }]);
    const shop = await shopDto(
      db.ShopSettingsModel.build({ id: 'shop', name: 'Shop', logoFileId: 'logo', version: 1 }),
    );
    assert.equal(shop.logoUrl, 'https://images.example/logo');
    db.FileModel.findByPk = async () => ({
      url: 'https://private.example/logo',
      metadata: { private: true },
    });
    assert.equal(
      (await shopDto(db.ShopSettingsModel.build({ id: 'shop', logoFileId: 'logo' }))).logoUrl,
      '',
    );
  } finally {
    db.FileModel.findAll = originalFindAll;
    db.FileModel.findByPk = originalFindByPk;
  }
});
