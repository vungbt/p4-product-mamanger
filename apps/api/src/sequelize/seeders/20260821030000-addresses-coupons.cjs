'use strict';

const { Op } = require('sequelize');
const { data, date, money, now, uuid } = require('../seed-data.cjs');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'addresses',
      data.addresses.map((address) => ({
        id: uuid(address.id),
        user_id: uuid(address.userId),
        full_name: address.fullName,
        phone: address.phone,
        line1: address.line1,
        city: address.city,
        is_default: address.isDefault,
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true },
    );

    await queryInterface.bulkInsert(
      'coupons',
      data.coupons.map((coupon) => ({
        id: uuid(coupon.id),
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        min_order_amount: money(coupon.minOrderAmount),
        max_discount: coupon.maxDiscount == null ? null : money(coupon.maxDiscount),
        usage_limit: coupon.usageLimit,
        used_count: coupon.usedCount,
        starts_at: date(coupon.startsAt),
        ends_at: date(coupon.endsAt),
        is_active: coupon.isActive,
        created_at: now,
        updated_at: now,
      })),
      { ignoreDuplicates: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('coupons', {
      id: { [Op.in]: data.coupons.map((x) => uuid(x.id)) },
    });
    await queryInterface.bulkDelete('addresses', {
      id: { [Op.in]: data.addresses.map((x) => uuid(x.id)) },
    });
  },
};
