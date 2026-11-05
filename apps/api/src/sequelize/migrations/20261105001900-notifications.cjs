module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      await q.createTable(
        'notification_preferences',
        {
          user_id: { type: S.UUID, primaryKey: true, references: { model: 'users', key: 'id' } },
          transactional_email: { type: S.BOOLEAN, allowNull: false },
          marketing_email: { type: S.BOOLEAN, allowNull: false },
          stock_email: { type: S.BOOLEAN, allowNull: false },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.createTable(
        'notifications',
        {
          id: { type: S.UUID, primaryKey: true },
          user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          event_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'domain_events', key: 'id' },
          },
          type: { type: S.STRING, allowNull: false },
          title: { type: S.STRING, allowNull: false },
          body: { type: S.TEXT, allowNull: false },
          href: { type: S.STRING, allowNull: false },
          read_at: { type: S.DATE, allowNull: true },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('notifications', ['user_id', 'event_id'], { unique: true, transaction });
      await q.addIndex('notifications', ['user_id', 'read_at', 'created_at'], { transaction });
      await q.createTable(
        'notification_templates',
        {
          id: { type: S.UUID, primaryKey: true },
          type: { type: S.STRING, allowNull: false },
          locale: { type: S.STRING, allowNull: false },
          subject: { type: S.STRING, allowNull: false },
          body: { type: S.TEXT, allowNull: false },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('notification_templates', ['type', 'locale'], { unique: true, transaction });
      await q.createTable(
        'notification_deliveries',
        {
          id: { type: S.UUID, primaryKey: true },
          event_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'domain_events', key: 'id' },
          },
          user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          status: { type: S.STRING, allowNull: false },
          provider_reference: { type: S.STRING, allowNull: true },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('notification_deliveries', ['event_id', 'user_id'], {
        unique: true,
        transaction,
      });
    });
  },
  async down(q) {
    for (const table of [
      'notification_deliveries',
      'notification_templates',
      'notifications',
      'notification_preferences',
    ])
      await q.dropTable(table);
  },
};
