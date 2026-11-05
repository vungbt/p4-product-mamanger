module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      await q.createTable(
        'processes',
        {
          id: { type: S.UUID, primaryKey: true },
          user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          kind: { type: S.STRING, allowNull: false },
          state: { type: S.STRING, allowNull: false },
          phase: { type: S.STRING, allowNull: false },
          input: { type: S.JSONB, allowNull: false },
          version: { type: S.INTEGER, allowNull: false },
          total: { type: S.INTEGER, allowNull: false },
          processed: { type: S.INTEGER, allowNull: false },
          succeeded: { type: S.INTEGER, allowNull: false },
          failed: { type: S.INTEGER, allowNull: false },
          error_code: { type: S.STRING, allowNull: true },
          result: { type: S.JSONB, allowNull: true },
          output_key: { type: S.STRING, allowNull: true },
          expires_at: { type: S.DATE, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('processes', ['user_id', 'created_at'], { transaction });
      await q.createTable(
        'process_items',
        {
          id: { type: S.UUID, primaryKey: true },
          process_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'processes', key: 'id' },
            onDelete: 'CASCADE',
          },
          index: { type: S.INTEGER, allowNull: false },
          state: { type: S.STRING, allowNull: false },
          data: { type: S.JSONB, allowNull: false },
          result: { type: S.JSONB, allowNull: true },
          issues: { type: S.JSONB, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('process_items', ['process_id', 'index'], { unique: true, transaction });
      await q.createTable(
        'realtime_events',
        {
          id: { type: S.BIGINT, autoIncrement: true, primaryKey: true },
          user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          payload: { type: S.JSONB, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('realtime_events', ['user_id', 'id'], { transaction });
    });
  },
  async down(q) {
    await q.dropTable('realtime_events');
    await q.dropTable('process_items');
    await q.dropTable('processes');
  },
};
