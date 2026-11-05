module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      for (const [name, spec] of Object.entries({
        order_item_id: {
          type: S.UUID,
          allowNull: true,
          references: { model: 'order_items', key: 'id' },
        },
        moderation_status: { type: S.STRING, allowNull: false, defaultValue: 'pending' },
        verified_purchase: { type: S.BOOLEAN, allowNull: false, defaultValue: false },
        media_ids: { type: S.ARRAY(S.UUID), allowNull: false, defaultValue: [] },
        reply: { type: S.TEXT, allowNull: true },
        moderation_reason: { type: S.TEXT, allowNull: true },
        version: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
      }))
        await q.addColumn('reviews', name, spec, { transaction });
      await q.addIndex('reviews', ['product_id', 'user_id'], { unique: true, transaction });
      await q.createTable(
        'review_reports',
        {
          id: { type: S.UUID, primaryKey: true },
          review_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'reviews', key: 'id' },
          },
          user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          reason: { type: S.TEXT, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('review_reports', ['review_id', 'user_id'], { unique: true, transaction });
    });
  },
  async down(q) {
    await q.dropTable('review_reports');
    await q.removeIndex('reviews', ['product_id', 'user_id']);
    for (const col of [
      'order_item_id',
      'moderation_status',
      'verified_purchase',
      'media_ids',
      'reply',
      'moderation_reason',
      'version',
    ])
      await q.removeColumn('reviews', col);
  },
};
