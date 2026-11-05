module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      await q.createTable(
        'support_tickets',
        {
          id: { type: S.UUID, primaryKey: true },
          user_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          order_id: { type: S.UUID, allowNull: true, references: { model: 'orders', key: 'id' } },
          subject: { type: S.STRING, allowNull: false },
          category: { type: S.STRING, allowNull: false },
          status: { type: S.STRING, allowNull: false },
          assignee_id: { type: S.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('support_tickets', ['user_id', 'created_at'], { transaction });
      await q.createTable(
        'support_messages',
        {
          id: { type: S.UUID, primaryKey: true },
          ticket_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'support_tickets', key: 'id' },
          },
          author_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          body: { type: S.TEXT, allowNull: false },
          internal: { type: S.BOOLEAN, allowNull: false },
          attachment_ids: { type: S.ARRAY(S.UUID), allowNull: false, defaultValue: [] },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
    });
  },
  async down(q) {
    await q.dropTable('support_messages');
    await q.dropTable('support_tickets');
  },
};
