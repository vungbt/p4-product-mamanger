'use strict';
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      const columns = {
        phone: { type: S.STRING, allowNull: true },
        locale: { type: S.STRING, allowNull: false, defaultValue: 'vi' },
        timezone: { type: S.STRING, allowNull: false, defaultValue: 'Asia/Ho_Chi_Minh' },
        account_status: { type: S.STRING, allowNull: false, defaultValue: 'active' },
        email_verified_at: { type: S.DATE, allowNull: true },
        staff_role: { type: S.STRING, allowNull: true },
        version: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
        auth_version: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
      };
      for (const [key, definition] of Object.entries(columns))
        await q.addColumn('users', key, definition, { transaction });
      await q.sequelize.query("UPDATE users SET staff_role = 'owner' WHERE role = 'admin'", {
        transaction,
      });
      await q.createTable(
        'account_tokens',
        {
          id: { type: S.UUID, primaryKey: true },
          user_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          purpose: { type: S.STRING, allowNull: false },
          token_hash: { type: S.STRING, allowNull: false, unique: true },
          data: { type: S.JSONB, allowNull: false },
          expires_at: { type: S.DATE, allowNull: false },
          consumed_at: { type: S.DATE, allowNull: true },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('account_tokens', ['user_id', 'purpose', 'expires_at'], { transaction });
    });
  },
  async down(q) {
    await q.sequelize.transaction(async (transaction) => {
      await q.dropTable('account_tokens', { transaction });
      for (const key of [
        'phone',
        'locale',
        'timezone',
        'account_status',
        'email_verified_at',
        'staff_role',
        'version',
        'auth_version',
      ])
        await q.removeColumn('users', key, { transaction });
    });
  },
};
