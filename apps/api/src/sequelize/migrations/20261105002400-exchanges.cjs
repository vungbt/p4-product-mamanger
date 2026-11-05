module.exports = {
  async up(q, S) {
    await q.createTable('exchange_requests', {
      id: { type: S.UUID, primaryKey: true },
      user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      order_id: { type: S.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
      return_id: {
        type: S.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'return_requests', key: 'id' },
      },
      status: { type: S.STRING, allowNull: false },
      items: { type: S.JSONB, allowNull: false },
      reason: { type: S.TEXT, allowNull: false },
      price_difference: { type: S.INTEGER, allowNull: true },
      original_refund_amount: { type: S.INTEGER, allowNull: true },
      quote_id: {
        type: S.UUID,
        allowNull: true,
        references: { model: 'checkout_quotes', key: 'id' },
      },
      replacement_order_id: {
        type: S.UUID,
        allowNull: true,
        unique: true,
        references: { model: 'orders', key: 'id' },
      },
      refund_id: { type: S.UUID, allowNull: true, references: { model: 'refunds', key: 'id' } },
      version: { type: S.INTEGER, allowNull: false },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
  },
  async down(q) {
    await q.dropTable('exchange_requests');
  },
};
