module.exports = {
  async up(q, S) {
    await q.createTable('report_exports', {
      id: { type: S.UUID, primaryKey: true },
      user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      report: { type: S.STRING, allowNull: false },
      filters: { type: S.JSONB, allowNull: false },
      status: { type: S.STRING, allowNull: false },
      content: { type: S.TEXT, allowNull: true },
      expires_at: { type: S.DATE, allowNull: false },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
  },
  async down(q) {
    await q.dropTable('report_exports');
  },
};
