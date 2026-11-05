module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      await q.createTable(
        'shop_settings',
        {
          id: { type: S.STRING, primaryKey: true },
          name: { type: S.STRING, allowNull: false },
          support_email: { type: S.STRING, allowNull: false },
          support_phone: { type: S.STRING, allowNull: false },
          logo_file_id: {
            type: S.UUID,
            allowNull: true,
            references: { model: 'files', key: 'id' },
          },
          default_locale: { type: S.STRING, allowNull: false },
          currency: { type: S.STRING, allowNull: false },
          timezone: { type: S.STRING, allowNull: false },
          quote_ttl_seconds: { type: S.INTEGER, allowNull: false },
          reservation_ttl_seconds: { type: S.INTEGER, allowNull: false },
          return_window_days: { type: S.INTEGER, allowNull: false },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.createTable(
        'shipping_methods',
        {
          id: { type: S.UUID, primaryKey: true },
          name: { type: S.STRING, allowNull: false },
          cities: { type: S.ARRAY(S.STRING), allowNull: false },
          active: { type: S.BOOLEAN, allowNull: false },
          cod_enabled: { type: S.BOOLEAN, allowNull: false },
          fee: { type: S.INTEGER, allowNull: false },
          free_above: { type: S.INTEGER, allowNull: true },
          estimated_days: { type: S.INTEGER, allowNull: false },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.sequelize.query(
        "INSERT INTO shop_settings VALUES ('shop','P4 Store','','',NULL,'vi','VND','Asia/Ho_Chi_Minh',600,1800,7,1,NOW(),NOW())",
        { transaction },
      );
      await q.sequelize.query(
        "INSERT INTO shipping_methods VALUES ('00000000-0000-4000-8000-000000000001','Standard',ARRAY['*'],true,true,30000,500000,3,1,NOW(),NOW())",
        { transaction },
      );
      await q.sequelize.query(
        'ALTER TABLE shipping_methods ADD CONSTRAINT shipping_fee_valid CHECK (fee >= 0 AND (free_above IS NULL OR free_above >= 0) AND estimated_days >= 1)',
        { transaction },
      );
    });
  },
  async down(q) {
    await q.dropTable('shipping_methods');
    await q.dropTable('shop_settings');
  },
};
