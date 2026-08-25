'use strict';

const { Op } = require('sequelize');
const { data, date, money, uuid } = require('../seed-data.cjs');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'refunds',
      data.refunds.map((refund) => ({
        id: uuid(refund.id),
        payment_id: uuid(refund.paymentId),
        order_id: uuid(refund.orderId),
        amount: money(refund.amount),
        status: refund.status,
        reason: refund.reason,
        created_at: date(refund.createdAt),
        updated_at: date(refund.createdAt),
      })),
      { ignoreDuplicates: true },
    );
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('refunds', {
      id: { [Op.in]: data.refunds.map((x) => uuid(x.id)) },
    });
  },
};
