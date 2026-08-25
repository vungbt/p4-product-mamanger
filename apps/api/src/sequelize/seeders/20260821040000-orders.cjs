'use strict';

const { Op } = require('sequelize');
const { data, date, money, uuid } = require('../seed-data.cjs');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'orders',
      data.orders.map((order) => ({
        id: uuid(order.id),
        user_id: uuid(order.userId),
        user_email: order.userEmail,
        total: money(order.total),
        status: order.status,
        address_id: null,
        shipping_full_name: order.shippingAddress.fullName,
        shipping_phone: order.shippingAddress.phone,
        shipping_line1: order.shippingAddress.line1,
        shipping_city: order.shippingAddress.city,
        shipping_fee: money(order.shippingFee),
        subtotal: money(order.subtotal),
        discount_amount: money(order.discountAmount),
        created_at: date(order.createdAt),
        updated_at: date(order.createdAt),
      })),
      { ignoreDuplicates: true },
    );

    await queryInterface.bulkInsert(
      'order_items',
      data.orders.flatMap((order) =>
        order.items.map((item, index) => ({
          id: uuid(`${order.id}:item:${index}`),
          order_id: uuid(order.id),
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: money(item.unitPrice),
          created_at: date(order.createdAt),
          updated_at: date(order.createdAt),
        })),
      ),
      { ignoreDuplicates: true },
    );

    const orderCoupons = data.orders.filter((order) => order.coupon);
    if (orderCoupons.length) {
      await queryInterface.bulkInsert(
        'order_coupons',
        orderCoupons.map((order) => ({
          id: uuid(`${order.id}:coupon`),
          order_id: uuid(order.id),
          coupon_id: uuid(order.coupon.couponId),
          code: order.coupon.code,
          discount_amount: money(order.coupon.discountAmount),
          created_at: date(order.createdAt),
          updated_at: date(order.createdAt),
        })),
        { ignoreDuplicates: true },
      );
    }
  },

  async down(queryInterface) {
    const ids = data.orders.map((order) => uuid(order.id));
    await queryInterface.bulkDelete('order_coupons', { order_id: { [Op.in]: ids } });
    await queryInterface.bulkDelete('order_items', { order_id: { [Op.in]: ids } });
    await queryInterface.bulkDelete('orders', { id: { [Op.in]: ids } });
  },
};
