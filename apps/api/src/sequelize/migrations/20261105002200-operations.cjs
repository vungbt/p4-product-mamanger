module.exports = {
  async up(q, S) {
    await q.createTable('rate_limit_buckets', {
      key: { type: S.STRING, primaryKey: true },
      count: { type: S.INTEGER, allowNull: false },
      reset_at: { type: S.DATE, allowNull: false },
    });
    await q.addIndex('rate_limit_buckets', ['reset_at']);
    await q.createTable('worker_heartbeats', {
      id: { type: S.STRING, primaryKey: true },
      last_seen_at: { type: S.DATE, allowNull: false },
    });
  },
  async down(q) {
    await q.dropTable('worker_heartbeats');
    await q.dropTable('rate_limit_buckets');
  },
};
