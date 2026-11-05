import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { Op } from 'sequelize';
import {
  AddressModel,
  CategoryModel,
  CouponModel,
  OrderItemModel,
  OrderModel,
  ProductImageModel,
  ProductModel,
  RefundModel,
  ReviewModel,
  sequelize,
  UserModel,
} from '../dist/sequelize/models/index.js';

const apiURL = process.env.P4_TEST_API_URL;

describe('list API integration against the existing local database (read-only resources)', {
  skip: !apiURL,
}, () => {
  let admin;
  let user;
  let product;

  async function login(email) {
    const response = await fetch(`${apiURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    });
    const body = await response.json();
    assert.equal(response.status, 200, 'Local seed account must log in');
    assert.equal(Object.hasOwn(body.data.user, 'passwordHash'), false);
    assert.equal(Object.hasOwn(body.data.user, 'googleId'), false);
    return body.data;
  }

  async function get(path, session = admin, expected = 200) {
    const response = await fetch(`${apiURL}${path}`, {
      headers: { Authorization: `Bearer ${session.token}`, 'Accept-Language': 'vi' },
    });
    const body = await response.json();
    assert.equal(response.status, expected, `${path}: ${JSON.stringify(body)}`);
    return body;
  }

  before(async () => {
    assert.ok(
      ['127.0.0.1', 'localhost'].includes(new URL(apiURL).hostname),
      'Only localhost test targets are allowed',
    );
    await sequelize.authenticate();
    admin = await login('admin@example.com');
    const account = await UserModel.findOne({ where: { role: 'user' }, order: [['id', 'ASC']] });
    assert.ok(account, 'Existing local seed user required');
    user = await login(account.email);
    product = await ProductModel.findOne({ order: [['id', 'ASC']] });
    assert.ok(product, 'Existing local seed product required');
  });

  after(async () => {
    await sequelize.close();
  });

  test('DTO selection excludes model metadata and preserves transformed properties', async () => {
    const categories = await get('/categories');
    assert.ok(categories.data.length > 0);
    for (const category of categories.data) {
      assert.deepEqual(Object.keys(category).sort(), ['description', 'id', 'name', 'slug']);
    }
    const detail = await get(`/products/${product.id}`);
    assert.equal(typeof detail.data.imageUrl, 'string');
    assert.ok(Array.isArray(detail.data.images));
    assert.equal(Object.hasOwn(detail.data, 'createdAt'), false);
    const dashboard = await get('/dashboard/stats');
    assert.equal(typeof dashboard.data.totalRevenue, 'number');
    assert.ok(dashboard.data.lowStockProducts.every((row) => typeof row.imageUrl === 'string'));
  });

  test('products: search-only, literal wildcards and ranges match database counts', async () => {
    const term = product.name.slice(0, 8);
    const escaped = term.replace(/[\\%_]/g, '\\$&');
    const count = await ProductModel.count({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${escaped}%` } },
          { description: { [Op.iLike]: `%${escaped}%` } },
        ],
      },
    });
    const result = await get(
      `/products?q=${encodeURIComponent(term)}&sortBy=price&sortOrder=asc&pageSize=10`,
    );
    assert.equal(result.meta.total, count);
    assert.ok(
      result.data.every((row, index, rows) => index === 0 || rows[index - 1].price <= row.price),
    );
    const literal = await get('/products?q=%25_');
    const literalCount = await ProductModel.count({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: '%\\%\\_%' } },
          { description: { [Op.iLike]: '%\\%\\_%' } },
        ],
      },
    });
    assert.equal(literal.meta.total, literalCount);
    const range = await get(
      `/products?minPrice=${product.price}&maxPrice=${product.price}&minStock=0`,
    );
    assert.ok(range.data.every((row) => row.price === product.price && row.stock >= 0));
    const category = await CategoryModel.findOne();
    if (category) {
      const filtered = await get(`/products?categoryId=${category.id}`);
      assert.equal(
        filtered.meta.total,
        await ProductModel.count({ where: { categoryId: category.id, status: 'active' } }),
      );
    }
  });

  test('products: tied sorting yields disjoint pages and complete galleries', async () => {
    const first = await get('/products?sortBy=stock&sortOrder=asc&pageSize=5');
    const second = await get('/products?sortBy=stock&sortOrder=asc&pageSize=5&page=2');
    assert.equal(first.meta.total, await ProductModel.count({ where: { status: 'active' } }));
    assert.equal(
      new Set([...first.data, ...second.data].map((row) => row.id)).size,
      first.data.length + second.data.length,
    );
    for (const row of [...first.data, ...second.data]) {
      assert.equal(
        row.images.length,
        await ProductImageModel.count({ where: { productId: row.id } }),
      );
    }
    const beyond = await get('/products?page=100000');
    assert.equal(beyond.data.length, 0);
    assert.equal(beyond.meta.total, first.meta.total);
  });

  test('orders: search includes item names, SQL totals are not multiplied by item count', async () => {
    const item = await OrderItemModel.findOne();
    assert.ok(item);
    const result = await get(
      `/orders?q=${encodeURIComponent(item.productName)}&pageSize=100&sortBy=total&sortOrder=desc`,
    );
    assert.ok(result.data.length > 0);
    const all = [];
    for (let page = 1; page <= result.meta.totalPages; page++) {
      const current =
        page === 1
          ? result
          : await get(
              `/orders?q=${encodeURIComponent(item.productName)}&pageSize=100&sortBy=total&sortOrder=desc&page=${page}`,
            );
      all.push(...current.data);
    }
    assert.equal(new Set(all.map((row) => row.id)).size, result.meta.total);
    assert.ok(
      all.every(
        (row) =>
          row.items.some((i) =>
            i.productName.toLowerCase().includes(item.productName.toLowerCase()),
          ) ||
          row.userEmail.toLowerCase().includes(item.productName.toLowerCase()) ||
          row.id.includes(item.productName) ||
          row.status.includes(item.productName),
      ),
    );
    assert.ok(all.every((row, index) => index === 0 || all[index - 1].total >= row.total));
    for (const row of all.slice(0, 5))
      assert.equal(row.items.length, await OrderItemModel.count({ where: { orderId: row.id } }));
    const full = await get('/orders?pageSize=5');
    assert.equal(full.meta.total, await OrderModel.count());
  });

  test('orders: status/payment/shipment/date/amount filters reflect all matching rows', async () => {
    const result = await get(
      '/orders?status=shipping&paymentStatus=paid&shipmentStatus=shipped&minTotal=0&sortBy=total&sortOrder=asc',
    );
    assert.ok(
      result.data.every(
        (row) =>
          row.status === 'shipping' &&
          row.payment?.status === 'paid' &&
          row.shipment?.status === 'shipped',
      ),
    );
    const dated = await get('/orders?createdFrom=2026-01-01&createdTo=2026-12-31&pageSize=5');
    assert.equal(
      dated.meta.total,
      await OrderModel.count({
        where: {
          createdAt: {
            [Op.gte]: new Date('2026-01-01'),
            [Op.lte]: new Date('2026-12-31T23:59:59.999Z'),
          },
        },
      }),
    );
  });

  test('orders/mine: filters and search never escape authenticated user scope', async () => {
    const result = await get('/orders/mine?sortBy=total&sortOrder=desc&pageSize=100', user);
    assert.equal(result.meta.total, await OrderModel.count({ where: { userId: user.user.id } }));
    assert.ok(result.data.every((row) => row.userId === user.user.id));
    const other = await OrderModel.findOne({ where: { userId: { [Op.ne]: user.user.id } } });
    if (other) {
      const found = await get(`/orders/mine?q=${other.id}`, user);
      assert.equal(found.meta.total, 0);
    }
    await get('/orders?page=1', user, 403);
  });

  test('coupons: legacy envelope, active/type filters and pagination', async () => {
    const legacy = await get('/coupons');
    assert.equal(legacy.meta, undefined);
    assert.equal(legacy.data.length, await CouponModel.count());
    const result = await get('/coupons?isActive=false&sortBy=code&sortOrder=asc');
    assert.equal(result.meta.total, await CouponModel.count({ where: { isActive: false } }));
    assert.ok(result.data.every((row) => row.isActive === false));
  });

  test('refunds: orderId-only keeps legacy envelope; status and amount filters paginate', async () => {
    const refund = await RefundModel.findOne();
    if (refund) {
      const legacy = await get(`/refunds?orderId=${refund.orderId}`);
      assert.equal(legacy.meta, undefined);
      assert.ok(legacy.data.every((row) => row.orderId === refund.orderId));
    }
    const result = await get('/refunds?status=completed&minAmount=0&sortBy=amount&sortOrder=asc');
    assert.equal(
      result.meta.total,
      await RefundModel.count({ where: { status: 'completed', amount: { [Op.gte]: 0 } } }),
    );
    assert.ok(
      result.data.every(
        (row, index, rows) =>
          row.status === 'completed' && (index === 0 || rows[index - 1].amount <= row.amount),
      ),
    );
  });

  test('reviews: product-scoped legacy and rating-filtered lists', async () => {
    const review = await ReviewModel.findOne();
    const productId = review?.productId ?? product.id;
    const legacy = await get(`/products/${productId}/reviews`);
    assert.equal(legacy.meta, undefined);
    assert.equal(
      legacy.data.length,
      await ReviewModel.count({ where: { productId, moderationStatus: 'published' } }),
    );
    const result = await get(
      `/products/${productId}/reviews?rating=5&sortBy=rating&sortOrder=desc`,
    );
    assert.equal(
      result.meta.total,
      await ReviewModel.count({ where: { productId, rating: 5, moderationStatus: 'published' } }),
    );
    assert.ok(result.data.every((row) => row.productId === productId && row.rating === 5));
  });

  test('addresses: city/default filters and pagination remain user scoped', async () => {
    const legacy = await get('/addresses', user);
    assert.equal(legacy.meta, undefined);
    assert.equal(legacy.data.length, await AddressModel.count({ where: { userId: user.user.id } }));
    const result = await get('/addresses?isDefault=false&sortBy=city&pageSize=5', user);
    assert.equal(
      result.meta.total,
      await AddressModel.count({ where: { userId: user.user.id, isDefault: false } }),
    );
    assert.ok(result.data.every((row) => row.userId === user.user.id && row.isDefault === false));
  });

  test('SQL-like search text is treated as a literal substring', async () => {
    const q = encodeURIComponent("unmatched-query' OR 1=1 --");
    for (const path of ['/products', '/orders', '/refunds', '/coupons']) {
      const result = await get(`${path}?q=${q}`);
      assert.equal(result.meta.total, 0);
    }
  });

  test('invalid sort, repeated query, malformed UUID, range and date errors return localized fields', async () => {
    for (const path of [
      '/products?sortBy=price;DROP TABLE products',
      '/products?q=a&q=b',
      '/products?categoryId=invalid',
      '/products?pageSize[toString]=invalid',
      '/products?minPrice=20&maxPrice=10',
      '/orders?createdFrom=2026-11-05&createdTo=2026-11-04',
      '/orders?createdFrom=2026-02-30',
      '/refunds?orderId=invalid',
      '/coupons?isActive=maybe',
    ]) {
      const result = await get(path, admin, 400);
      assert.equal(result.code, 'input_valid_error');
      assert.ok(
        Object.values(result.extensions).every(
          (messages) =>
            messages.length > 0 && messages.every((message) => !message.includes('validator:')),
        ),
      );
    }
  });
});
