module.exports = {
  async up(q, S) {
    await q.createTable('return_requests', {
      id: { type: S.UUID, primaryKey: true },
      order_id: { type: S.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
      user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      status: { type: S.STRING, allowNull: false },
      reason: { type: S.TEXT, allowNull: false },
      resolution: { type: S.TEXT, allowNull: true },
      items: { type: S.JSONB, allowNull: false },
      evidence_ids: { type: S.ARRAY(S.UUID), allowNull: false, defaultValue: [] },
      inspection: { type: S.JSONB, allowNull: true },
      version: { type: S.INTEGER, allowNull: false },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
    await q.addIndex('return_requests', ['order_id', 'status']);
  },
  async down(q) {
    await q.dropTable('return_requests');
  },
};
