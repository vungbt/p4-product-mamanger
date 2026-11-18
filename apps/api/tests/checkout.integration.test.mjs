import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { quantityAmount } from '../dist/modules/orders/order-lifecycle.service.js';
import { allocateDiscount } from '../dist/modules/promotions/promotions.service.js';
import * as db from '../dist/sequelize/models/index.js';

const base = process.env.P4_TEST_API_URL;
test('discount and per-unit partial amounts conserve every currency unit', () => {
  assert.deepEqual(allocateDiscount(2, [1, 1, 1]), [1, 1, 0]);
  assert.equal(
    allocateDiscount(173, [100, 99, 17]).reduce((a, b) => a + b),
    173,
  );
  assert.equal(
    quantityAmount(101, 3, 0, 1) + quantityAmount(101, 3, 1, 1) + quantityAmount(101, 3, 2, 1),
    101,
  );
  assert.throws(() => quantityAmount(101, 3, 2, 2));
});
describe('cart/quote/order/payment on local API', { skip: !base }, () => {
  const suffix = randomUUID();
  const users = [];
  let admin, customer, other, product, variant, file, shipping, coupon;
  async function call(method, path, body, session = customer, expected = 200, key) {
    const response = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(session ? { authorization: `Bearer ${session.token}` } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
    return result.data;
  }
  async function account(label) {
    const row = await db.UserModel.create({
      email: `${label}-${suffix}@example.invalid`,
      role: 'user',
      passwordHash: await bcrypt.hash('test-local-12345', 10),
    });
    users.push(row.id);
    const session = await call(
      'POST',
      '/auth/login',
      { email: row.email, password: 'test-local-12345' },
      null,
    );
    const address = await call(
      'POST',
      '/addresses',
      {
        fullName: label,
        phone: '0901234567',
        line1: 'Test address',
        city: 'Test city',
        isDefault: true,
      },
      session,
      201,
    );
    return { ...session, addressId: address.id };
  }
  async function quote(session = customer, quantity = 1, code) {
    return call(
      'POST',
      '/checkout/quotes',
      {
        addressId: session.addressId,
        shippingMethodId: shipping.id,
        items: [{ variantId: variant.id, quantity }],
        couponCode: code,
        price: 1,
        total: 1,
        shippingFee: 1,
      },
      session,
      201,
    );
  }
  async function order(session = customer, quantity = 1) {
    const priced = await quote(session, quantity);
    return call('POST', '/orders', { quoteId: priced.id }, session, 201, `order-${randomUUID()}`);
  }
  before(async () => {
    assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
    admin = await call(
      'POST',
      '/auth/login',
      { email: 'admin@example.com', password: 'password123' },
      null,
    );
    customer = await account('checkout');
    other = await account('foreign');
    product = await call(
      'POST',
      '/products',
      { name: 'Checkout garment', price: 101, description: 'Local fixture', stock: 30 },
      admin,
      201,
    );
    file = await db.FileModel.create({
      storageId: `fixture-${suffix}`,
      provider: 'system',
      url: 'https://example.invalid/test.png',
    });
    await db.ProductModel.update({ imageId: file.id }, { where: { id: product.id } });
    const draft = await call('GET', `/admin/products/${product.id}`, undefined, admin);
    await call(
      'PATCH',
      `/products/${product.id}/publication`,
      { status: 'active', expectedVersion: draft.version },
      admin,
    );
    variant = (await call('GET', `/products/${product.id}/variants`))[0];
    shipping = await call(
      'POST',
      '/admin/shipping-methods',
      {
        name: 'Fixture shipping',
        cities: ['test city'],
        active: true,
        codEnabled: true,
        fee: 1000,
        freeAbove: 300,
        estimatedDays: 2,
      },
      admin,
      201,
    );
  });
  after(async () => {
    try {
      if (users.length) {
        await db.CartModel.destroy({ where: { userId: users } });
        const orders = await db.OrderModel.findAll({ where: { userId: users } });
        const ids = orders.map((row) => row.id);
        const payments = await db.PaymentModel.findAll({ where: { orderId: ids } });
        const shipments = await db.ShipmentModel.findAll({ where: { orderId: ids } });
        const shipmentIds = shipments.map((row) => row.id);
        await db.ShipmentEventModel.destroy({ where: { shipmentId: shipmentIds } });
        await db.ShipmentItemModel.destroy({ where: { shipmentId: shipmentIds } });
        await db.ShipmentModel.destroy({ where: { orderId: ids } });
        await db.ExchangeRequestModel.destroy({ where: { userId: users } });
        await db.RefundModel.destroy({ where: { orderId: ids } });
        await db.ReturnRequestModel.destroy({ where: { orderId: ids } });
        await db.PaymentLedgerModel.destroy({ where: { orderId: ids } });
        await db.PaymentAttemptModel.destroy({ where: { orderId: ids } });
        await db.PaymentModel.destroy({ where: { orderId: ids } });
        await db.CancellationRequestModel.destroy({ where: { orderId: ids } });
        await db.OrderEventModel.destroy({ where: { orderId: ids } });
        await db.CouponRedemptionModel.destroy({ where: { orderId: ids } });
        await db.OrderCouponModel.destroy({ where: { orderId: ids } });
        await db.InventoryReservationModel.destroy({ where: { orderId: ids } });
        const reviewRows = await db.ReviewModel.findAll({ where: { userId: users } });
        if (reviewRows.length)
          await db.sequelize.query('DELETE FROM review_reports WHERE review_id IN (:ids)', {
            replacements: { ids: reviewRows.map((row) => row.id) },
          });
        await db.ReviewModel.destroy({ where: { userId: users } });
        await db.OrderItemModel.destroy({ where: { orderId: ids } });
        await db.OrderModel.update({ quoteId: null }, { where: { id: ids } });
        await db.CheckoutQuoteModel.destroy({ where: { userId: users } });
        await db.OrderModel.destroy({ where: { id: ids } });
        const variants = product
          ? await db.ProductVariantModel.findAll({ where: { productId: product.id } })
          : [];
        const variantIds = variants.map((row) => row.id);
        await db.InventoryMovementModel.destroy({ where: { variantId: variantIds } });
        await db.ProductVariantModel.destroy({ where: { id: variantIds } });
        if (product) await db.ProductModel.destroy({ where: { id: product.id } });
        if (file) await db.FileModel.destroy({ where: { id: file.id } });
        if (shipping) await db.ShippingMethodModel.destroy({ where: { id: shipping.id } });
        if (coupon) await db.CouponModel.destroy({ where: { id: coupon.id } });
        await db.CartModel.destroy({ where: { userId: users } });
        await db.AddressModel.destroy({ where: { userId: users } });
        await db.RefreshTokenModel.destroy({ where: { userId: users } });
        await db.IdempotencyRecordModel.destroy({
          where: {
            [Op.or]: [
              { actorId: users },
              { scope: 'refund.create', key: `return-refund-${suffix}` },
            ],
          },
        });
        await db.AuditLogModel.destroy({
          where: {
            [Op.or]: [
              { actorId: users },
              {
                resourceId: [...ids, ...variantIds, product?.id, shipping?.id, coupon?.id].filter(
                  Boolean,
                ),
              },
            ],
          },
        });
        const attempts = payments.map((row) => row.id);
        const eventWhere = {
          [Op.or]: [
            { aggregateId: [...ids, ...variantIds, ...attempts] },
            { payload: { userId: { [Op.in]: users } } },
          ],
        };
        // A running worker may already have delivered these events as notifications.
        const events = await db.DomainEventModel.findAll({ attributes: ['id'], where: eventWhere });
        const eventIds = events.map((row) => row.id);
        await db.NotificationDeliveryModel.destroy({ where: { eventId: eventIds } });
        await db.NotificationModel.destroy({ where: { eventId: eventIds } });
        await db.DomainEventModel.destroy({ where: eventWhere });
        // Rows the worker creates for these users while the suite runs.
        for (const table of [
          'notification_deliveries',
          'notifications',
          'notification_preferences',
          'realtime_events',
        ])
          await db.sequelize.query(`DELETE FROM ${table} WHERE user_id IN (:users)`, {
            replacements: { users },
          });
        await db.UserModel.destroy({ where: { id: users } });
      }
    } finally {
      await db.sequelize.close();
    }
  });
  test('cart ownership/version and merge replay are enforced', async () => {
    const current = await call('GET', '/cart');
    const added = await call(
      'POST',
      '/cart/items',
      { variantId: variant.id, quantity: 1, expectedVersion: current.version },
      customer,
      201,
    );
    await call(
      'PATCH',
      `/cart/items/${added.items[0].id}`,
      { quantity: 2, expectedVersion: current.version },
      customer,
      409,
    );
    const foreign = await call('GET', '/cart', undefined, other);
    await call(
      'PATCH',
      `/cart/items/${added.items[0].id}`,
      { quantity: 2, expectedVersion: foreign.version },
      other,
      404,
    );
    const key = `merge-${suffix}`;
    const body = { items: [{ variantId: variant.id, quantity: 2 }] };
    await call('POST', '/cart/merge', body, customer, 200, key);
    await call('POST', '/cart/merge', body, customer, 200, key);
    assert.equal((await call('GET', '/cart')).items[0].quantity, 3);
  });
  test('quotes use server prices/shipping and reject foreign addresses', async () => {
    const priced = await quote();
    assert.equal(priced.subtotal, 101);
    assert.equal(priced.shippingFee, 1000);
    assert.equal(priced.total, 1101);
    await call('GET', `/checkout/quotes/${priced.id}`, undefined, other, 404);
    await call(
      'POST',
      '/checkout/quotes',
      { addressId: other.addressId, items: [{ variantId: variant.id, quantity: 1 }] },
      customer,
      404,
    );
    assert.equal((await quote(customer, 3)).shippingFee, 0);
  });
  test('concurrent order replay places once, consumed quote and stale prices conflict', async () => {
    const priced = await quote();
    const key = `order-${suffix}`;
    const results = await Promise.all([
      call('POST', '/orders', { quoteId: priced.id }, customer, 201, key),
      call('POST', '/orders', { quoteId: priced.id }, customer, 201, key),
    ]);
    assert.equal(results[0].id, results[1].id);
    await call('POST', '/orders', { quoteId: priced.id }, customer, 409, key + '-different');
    const stale = await quote();
    const current = await call('GET', `/admin/products/${product.id}/variants`, undefined, admin);
    const row = current.find((v) => v.id === variant.id);
    await call(
      'PATCH',
      `/products/${product.id}/variants/${variant.id}`,
      { price: 102, expectedVersion: row.version },
      admin,
    );
    await call('POST', '/orders', { quoteId: stale.id }, customer, 409, `stale-${suffix}`);
    assert.equal(results[0].items[0].unitPrice, 101);
    await call('POST', `/orders/${results[0].id}/cancel`, {}, customer);
  });
  test('coupon quota is reserved atomically and released when an unpaid order is cancelled', async () => {
    coupon = await call(
      'POST',
      '/coupons',
      { code: `TEST-${suffix}`, type: 'fixed', value: 11, usageLimit: 1, perUserLimit: 1 },
      admin,
      201,
    );
    const a = await quote(customer, 1, coupon.code);
    const b = await quote(other, 1, coupon.code);
    const first = await call(
      'POST',
      '/orders',
      { quoteId: a.id },
      customer,
      201,
      `coupon-${suffix}`,
    );
    await call('POST', '/orders', { quoteId: b.id }, other, 409, `coupon-other-${suffix}`);
    await call('POST', `/orders/${first.id}/cancel`, {}, customer);
    const second = await call(
      'POST',
      '/orders',
      { quoteId: b.id },
      other,
      201,
      `coupon-retry-${suffix}`,
    );
    await call('POST', `/orders/${second.id}/cancel`, {}, other);
    assert.equal((await db.CouponModel.findByPk(coupon.id)).usedCount, 0);
  });
  test('mock capture is idempotent and a paid partial cancellation refunds only those units', async () => {
    const placed = await order(customer, 2);
    const attempt = await call(
      'POST',
      `/orders/${placed.id}/payment-attempts`,
      { provider: 'mock' },
      customer,
      201,
      `payment-${suffix}`,
    );
    await call('POST', `/payments/${attempt.id}/mock-pay`, {});
    await call('POST', `/payments/${attempt.id}/mock-pay`, {});
    assert.equal(
      await db.PaymentLedgerModel.count({ where: { attemptId: attempt.id, kind: 'capture' } }),
      1,
    );
    const refreshed = await call('GET', `/orders/${placed.id}`);
    const cancellation = await call(
      'POST',
      `/orders/${placed.id}/cancellation-requests`,
      {
        expectedVersion: refreshed.version,
        reason: 'One unit only',
        items: [{ orderItemId: refreshed.items[0].id, quantity: 1 }],
      },
      customer,
      201,
    );
    await call(
      'POST',
      `/cancellation-requests/${cancellation.id}/approve`,
      { expectedVersion: cancellation.version },
      admin,
    );
    await call(
      'POST',
      `/cancellation-requests/${cancellation.id}/approve`,
      { expectedVersion: cancellation.version },
      admin,
    );
    const refunds = await db.RefundModel.findAll({ where: { orderId: placed.id } });
    assert.equal(refunds.length, 1);
    assert.equal(refunds[0].amount, 102);
    const after = await call('GET', `/orders/${placed.id}`);
    assert.notEqual(after.lifecycleStatus, 'cancelled');
    assert.equal(after.items[0].cancelledQuantity, 1);
    const { processRefund } = await import('../dist/modules/refunds/refund-processing.service.js');
    const event = await db.DomainEventModel.findOne({
      where: { aggregateId: refunds[0].id, type: 'refund.requested' },
    });
    await processRefund(event);
    await processRefund(event);
    assert.equal((await db.RefundModel.findByPk(refunds[0].id)).status, 'completed');
    assert.equal(
      await db.PaymentLedgerModel.count({ where: { attemptId: attempt.id, kind: 'refund' } }),
      1,
    );
  });
  test('COD supports multiple parcels, guards allocation and collects only after delivery', async () => {
    const placed = await order(customer, 2);
    const payment = await call(
      'POST',
      `/orders/${placed.id}/payment-attempts`,
      { provider: 'cod' },
      customer,
      201,
      `cod-${suffix}`,
    );
    let current = await call('GET', `/orders/${placed.id}`);
    await call('POST', `/orders/${placed.id}/confirm`, { expectedVersion: current.version }, admin);
    current = await call('GET', `/orders/${placed.id}`);
    await call(
      'POST',
      `/orders/${placed.id}/start-processing`,
      { expectedVersion: current.version },
      admin,
    );
    const parcels = [];
    for (let i = 0; i < 2; i++) {
      current = await call('GET', `/orders/${placed.id}`);
      parcels.push(
        await call(
          'POST',
          `/orders/${placed.id}/shipments`,
          {
            expectedVersion: current.version,
            carrier: 'manual',
            items: [{ orderItemId: current.items[0].id, quantity: 1 }],
          },
          admin,
          201,
        ),
      );
    }
    current = await call('GET', `/orders/${placed.id}`);
    await call(
      'POST',
      `/orders/${placed.id}/shipments`,
      {
        expectedVersion: current.version,
        carrier: 'manual',
        items: [{ orderItemId: current.items[0].id, quantity: 1 }],
      },
      admin,
      409,
    );
    await call(
      'POST',
      `/admin/payments/${payment.id}/cod-collection`,
      { reference: `cod-${suffix}`, amount: payment.amount },
      admin,
      409,
    );
    for (const parcel of parcels) {
      let next = parcel;
      for (const action of ['pack', 'ready', 'handover', 'out-for-delivery', 'deliver']) {
        const input = {
          expectedVersion: next.version,
          reference: `${parcel.id}-${action}`,
          trackingCode: `track-${parcel.id}`,
        };
        next = await call('POST', `/shipments/${parcel.id}/${action}`, input, admin);
        const replay = await call('POST', `/shipments/${parcel.id}/${action}`, input, admin);
        assert.equal(next.version, replay.version);
      }
      await call(
        'POST',
        `/shipments/${parcel.id}/pack`,
        { expectedVersion: next.version, reference: `${parcel.id}-backwards` },
        admin,
        409,
      );
    }
    current = await call('GET', `/orders/${placed.id}`);
    assert.equal(current.lifecycleStatus, 'completed');
    assert.equal((await call('GET', `/orders/${placed.id}/payments`))[0].status, 'pending');
    await call(
      'POST',
      `/admin/payments/${payment.id}/cod-collection`,
      { reference: `cod-${suffix}`, amount: payment.amount },
      admin,
    );
    assert.equal((await call('GET', `/orders/${placed.id}/payments`))[0].status, 'paid');
    current = await call('GET', `/orders/${placed.id}`);
    let review = await call(
      'POST',
      `/order-items/${current.items[0].id}/reviews`,
      { rating: 5, comment: 'Verified purchase' },
      customer,
      201,
    );
    await call(
      'POST',
      `/order-items/${current.items[0].id}/reviews`,
      { rating: 5, comment: 'Foreign reviewer' },
      other,
      403,
    );
    assert.equal(review.verifiedPurchase, true);
    assert.equal((await call('GET', `/products/${product.id}/review-summary`)).count, 0);
    review = await call(
      'POST',
      `/reviews/${review.id}/moderation`,
      { status: 'published', reason: 'Reviewed', expectedVersion: review.version },
      admin,
    );
    const publicReviews = await call('GET', `/products/${product.id}/reviews`);
    assert.equal(publicReviews.length, 1);
    assert.equal(Object.hasOwn(publicReviews[0], 'userEmail'), false);
    assert.equal((await call('GET', `/products/${product.id}/review-summary`)).average, 5);
    const balanceBefore = await db.ProductVariantModel.findByPk(variant.id);
    let returned = await call(
      'POST',
      `/orders/${placed.id}/returns`,
      {
        expectedVersion: current.version,
        reason: 'Damaged garment',
        items: [{ orderItemId: current.items[0].id, quantity: 1 }],
      },
      customer,
      201,
    );
    await call('GET', `/returns/${returned.id}`, undefined, other, 403);
    for (const action of ['approve', 'in-transit', 'receive'])
      returned = await call(
        'POST',
        `/returns/${returned.id}/${action}`,
        { expectedVersion: returned.version },
        admin,
      );
    const inspection = {
      expectedVersion: returned.version,
      inspection: [{ orderItemId: current.items[0].id, saleableQuantity: 0, damagedQuantity: 1 }],
    };
    returned = await call('POST', `/returns/${returned.id}/inspect`, inspection, admin);
    await call('POST', `/returns/${returned.id}/inspect`, inspection, admin);
    const balanceAfter = await db.ProductVariantModel.findByPk(variant.id);
    assert.equal(balanceAfter.onHand, balanceBefore.onHand);
    const refundInput = { returnId: returned.id, reason: 'Inspected return' };
    const refund = await call(
      'POST',
      `/orders/${placed.id}/refunds`,
      refundInput,
      admin,
      201,
      `return-refund-${suffix}`,
    );
    const replay = await call(
      'POST',
      `/orders/${placed.id}/refunds`,
      refundInput,
      admin,
      201,
      `return-refund-${suffix}`,
    );
    assert.equal(refund.id, replay.id);
    assert.equal(refund.amount, 102);
    await call('GET', `/refunds/${refund.id}`, undefined, other, 403);
    await call(
      'POST',
      `/admin/refunds/${refund.id}/manual-confirmation`,
      { expectedVersion: refund.version, reference: `transfer-${suffix}`, amount: refund.amount },
      admin,
    );
    await call(
      'POST',
      `/admin/refunds/${refund.id}/manual-confirmation`,
      { expectedVersion: refund.version, reference: `transfer-${suffix}`, amount: refund.amount },
      admin,
    );
    assert.equal((await db.RefundModel.findByPk(refund.id)).status, 'completed');
    let exchange = await call(
      'POST',
      `/orders/${placed.id}/exchanges`,
      {
        returnId: returned.id,
        items: [{ orderItemId: current.items[0].id, variantId: variant.id, quantity: 1 }],
        reason: 'Replacement garment',
      },
      customer,
      201,
    );
    await call('GET', `/exchanges/${exchange.id}`, undefined, other, 403);
    exchange = await call(
      'POST',
      `/exchanges/${exchange.id}/approve`,
      { expectedVersion: exchange.version },
      admin,
    );
    assert.equal(exchange.settlementPolicy, 'refund_and_repurchase');
    const replacementInput = { expectedVersion: exchange.version };
    const replacements = await Promise.all([
      call('POST', `/exchanges/${exchange.id}/create-replacement`, replacementInput, admin, 201),
      call('POST', `/exchanges/${exchange.id}/create-replacement`, replacementInput, admin, 201),
    ]);
    assert.equal(replacements[0].replacementOrderId, replacements[1].replacementOrderId);
    assert.equal(replacements[0].refundId, refund.id);
    assert.equal((await call('GET', `/orders/${placed.id}`)).items[0].variantId, variant.id);

    assert.equal((await call('GET', `/orders/${placed.id}`)).items[0].returnedQuantity, 1);
  });
  test('late captured payment records money and queues refund without resurrecting the expired order', async () => {
    const placed = await order();
    const attempt = await call(
      'POST',
      `/orders/${placed.id}/payment-attempts`,
      { provider: 'mock' },
      customer,
      201,
      `late-${suffix}`,
    );
    await db.InventoryReservationModel.update(
      { expiresAt: new Date(Date.now() - 1000) },
      { where: { orderId: placed.id } },
    );
    await db.PaymentAttemptModel.update(
      { expiresAt: new Date(Date.now() - 1000) },
      { where: { id: attempt.id } },
    );
    const capture = await call('POST', `/payments/${attempt.id}/mock-pay`, {});
    assert.equal(capture.late, true);
    const expired = await call('GET', `/orders/${placed.id}`);
    assert.equal(expired.lifecycleStatus, 'cancelled');
    const refunds = await db.RefundModel.findAll({ where: { orderId: placed.id } });
    assert.equal(refunds[0].amount, attempt.amount);
    assert.equal(refunds[0].status, 'pending');
  });
});
