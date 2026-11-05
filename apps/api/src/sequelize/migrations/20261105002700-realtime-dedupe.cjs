module.exports = {
  async up(q, S) {
    await q.addColumn('realtime_events', 'dedupe_key', {
      type: S.STRING,
      allowNull: false,
      unique: true,
      defaultValue: S.literal("'legacy:' || gen_random_uuid()::text"),
    });
  },
  async down(q) {
    await q.removeColumn('realtime_events', 'dedupe_key');
  },
};
