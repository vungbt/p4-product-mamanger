'use strict';
module.exports = {
  async up(q) {
    await q.sequelize.transaction(async (transaction) => {
      await q.sequelize.query(
        'WITH ranked AS (SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY updated_at DESC, id ASC) AS rn FROM addresses WHERE is_default = true) UPDATE addresses SET is_default = false WHERE id IN (SELECT id FROM ranked WHERE rn > 1)',
        { transaction },
      );
      await q.sequelize.query(
        'CREATE UNIQUE INDEX addresses_one_default_per_user ON addresses(user_id) WHERE is_default = true',
        { transaction },
      );
    });
  },
  async down(q) {
    await q.sequelize.query('DROP INDEX IF EXISTS addresses_one_default_per_user');
  },
};
