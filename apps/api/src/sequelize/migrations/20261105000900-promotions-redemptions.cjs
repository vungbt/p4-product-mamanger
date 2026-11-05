const { randomUUID } = require('node:crypto');
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      for (const [name, spec] of Object.entries({
        per_user_limit: { type: S.INTEGER, allowNull: true },
        variant_ids: { type: S.ARRAY(S.UUID), allowNull: false, defaultValue: [] },
        category_ids: { type: S.ARRAY(S.UUID), allowNull: false, defaultValue: [] },
        version: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
      }))
        await q.addColumn('coupons', name, spec, { transaction });
      await q.createTable(
        'promotions',
        {
          id: { type: S.UUID, primaryKey: true },
          name: { type: S.STRING, allowNull: false },
          type: { type: S.STRING, allowNull: false },
          value: { type: S.INTEGER, allowNull: false },
          min_order_amount: { type: S.INTEGER, allowNull: false },
          max_discount: { type: S.INTEGER, allowNull: true },
          variant_ids: { type: S.ARRAY(S.UUID), allowNull: false, defaultValue: [] },
          category_ids: { type: S.ARRAY(S.UUID), allowNull: false, defaultValue: [] },
          priority: { type: S.INTEGER, allowNull: false },
          is_active: { type: S.BOOLEAN, allowNull: false },
          starts_at: { type: S.DATE, allowNull: true },
          ends_at: { type: S.DATE, allowNull: true },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.createTable(
        'coupon_redemptions',
        {
          id: { type: S.UUID, primaryKey: true },
          coupon_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'coupons', key: 'id' },
          },
          order_id: {
            type: S.UUID,
            allowNull: false,
            unique: true,
            references: { model: 'orders', key: 'id' },
          },
          user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          status: { type: S.STRING, allowNull: false },
          amount: { type: S.INTEGER, allowNull: false },
          rule_version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('coupon_redemptions', ['coupon_id', 'user_id', 'status'], { transaction });
      const [rows] = await q.sequelize.query(
        'SELECT oc.*, o.user_id, o.status AS order_status FROM order_coupons oc JOIN orders o ON o.id = oc.order_id',
        { transaction },
      );
      for (const row of rows)
        await q.bulkInsert(
          'coupon_redemptions',
          [
            {
              id: randomUUID(),
              coupon_id: row.coupon_id,
              order_id: row.order_id,
              user_id: row.user_id,
              status:
                row.order_status === 'cancelled'
                  ? 'released'
                  : row.order_status === 'pending'
                    ? 'reserved'
                    : 'committed',
              amount: row.discount_amount,
              rule_version: 1,
              created_at: row.created_at,
              updated_at: new Date(),
            },
          ],
          { transaction },
        );
      await q.sequelize.query(
        "UPDATE coupons c SET used_count = (SELECT COUNT(*) FROM coupon_redemptions r WHERE r.coupon_id = c.id AND r.status IN ('reserved','committed'))",
        { transaction },
      );
    });
  },
  async down(q) {
    await q.dropTable('coupon_redemptions');
    await q.dropTable('promotions');
    for (const col of ['per_user_limit', 'variant_ids', 'category_ids', 'version'])
      await q.removeColumn('coupons', col);
  },
};
