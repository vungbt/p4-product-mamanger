module.exports = {
  async up(q, S) {
    await q.createTable('merchandising_entries', {
      id: { type: S.UUID, primaryKey: true },
      kind: { type: S.STRING, allowNull: false },
      key: { type: S.STRING, allowNull: false },
      payload: { type: S.JSONB, allowNull: false },
      active: { type: S.BOOLEAN, allowNull: false },
      starts_at: { type: S.DATE, allowNull: true },
      ends_at: { type: S.DATE, allowNull: true },
      version: { type: S.INTEGER, allowNull: false },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
    await q.addIndex('merchandising_entries', ['kind', 'key'], { unique: true });
  },
  async down(q) {
    await q.dropTable('merchandising_entries');
  },
};
