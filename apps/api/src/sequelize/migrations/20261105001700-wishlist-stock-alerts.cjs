module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      await q.createTable(
        'wishlist_items',
        {
          id: { type: S.UUID, primaryKey: true },
          user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          product_id: {
            type: S.STRING,
            allowNull: false,
            references: { model: 'products', key: 'id' },
          },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('wishlist_items', ['user_id', 'product_id'], { unique: true, transaction });
      await q.createTable(
        'stock_alert_subscriptions',
        {
          id: { type: S.UUID, primaryKey: true },
          user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          variant_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'product_variants', key: 'id' },
          },
          status: { type: S.STRING, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('stock_alert_subscriptions', ['user_id', 'variant_id'], {
        unique: true,
        transaction,
      });
    });
  },
  async down(q) {
    await q.dropTable('stock_alert_subscriptions');
    await q.dropTable('wishlist_items');
  },
};
