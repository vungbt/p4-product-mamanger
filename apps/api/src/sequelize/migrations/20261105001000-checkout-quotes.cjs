module.exports = {
  async up(q, S) {
    await q.createTable('checkout_quotes', {
      id: { type: S.UUID, primaryKey: true },
      user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      status: { type: S.STRING, allowNull: false },
      snapshot: { type: S.JSONB, allowNull: false },
      fingerprint: { type: S.STRING, allowNull: false },
      expires_at: { type: S.DATE, allowNull: false },
      order_id: { type: S.UUID, allowNull: true, references: { model: 'orders', key: 'id' } },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
    await q.addIndex('checkout_quotes', ['user_id', 'status', 'expires_at']);
  },
  async down(q) {
    await q.dropTable('checkout_quotes');
  },
};
