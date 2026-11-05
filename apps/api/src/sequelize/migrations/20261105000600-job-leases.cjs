module.exports = {
  async up(q, S) {
    await q.addColumn('domain_events', 'lease_token', { type: S.UUID, allowNull: true });
    await q.addColumn('domain_events', 'last_error_code', { type: S.STRING, allowNull: true });
    await q.addColumn('domain_events', 'dedupe_key', {
      type: S.STRING,
      allowNull: true,
      unique: true,
    });
    await q.createTable('job_attempts', {
      id: { type: S.UUID, primaryKey: true },
      event_id: {
        type: S.UUID,
        allowNull: false,
        references: { model: 'domain_events', key: 'id' },
        onDelete: 'CASCADE',
      },
      attempt: { type: S.INTEGER, allowNull: false },
      status: { type: S.STRING, allowNull: false },
      error_code: { type: S.STRING, allowNull: true },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
    });
  },
  async down(q) {
    await q.dropTable('job_attempts');
    for (const name of ['lease_token', 'last_error_code', 'dedupe_key'])
      await q.removeColumn('domain_events', name);
  },
};
