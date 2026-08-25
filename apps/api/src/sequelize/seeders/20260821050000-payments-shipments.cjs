'use strict';

const { Op } = require('sequelize');
const { data, date, money, uuid } = require('../seed-data.cjs');

const paymentOrders = data.orders.filter((order) => order.payment);
const shipmentOrders = data.orders.filter((order) => order.shipment);

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'payments',
      paymentOrders.map((order) => ({
        id: uuid(order.payment.id),
        order_id: uuid(order.id),
        provider: order.payment.provider,
        amount: money(order.payment.amount),
        status: order.payment.status,
        external_id: order.payment.externalId,
        paid_at: date(order.payment.paidAt, null),
        checkout_url: order.payment.checkoutUrl,
        created_at: date(order.createdAt),
        updated_at: date(order.createdAt),
      })),
      { ignoreDuplicates: true },
    );

    await queryInterface.bulkInsert(
      'shipments',
      shipmentOrders.map((order) => ({
        id: uuid(order.shipment.id),
        order_id: uuid(order.id),
        status: order.shipment.status,
        carrier: order.shipment.carrier,
        tracking_code: order.shipment.trackingCode,
        shipped_at: date(order.shipment.shippedAt, null),
        delivered_at: date(order.shipment.deliveredAt, null),
        created_at: date(order.createdAt),
        updated_at: date(order.createdAt),
      })),
      { ignoreDuplicates: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('shipments', {
      id: { [Op.in]: shipmentOrders.map((x) => uuid(x.shipment.id)) },
    });
    await queryInterface.bulkDelete('payments', {
      id: { [Op.in]: paymentOrders.map((x) => uuid(x.payment.id)) },
    });
  },
};
