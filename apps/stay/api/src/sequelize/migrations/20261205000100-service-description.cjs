'use strict';
/** Optional description of a service ("Dịch vụ chung" = "Thang máy, máy giặt, rác"). */
module.exports = {
  async up(q) {
    await q.sequelize.query(`
      ALTER TABLE service_definitions
        ADD COLUMN description text
          CHECK (description IS NULL OR (btrim(description) <> '' AND char_length(description) <= 500));
    `);
  },
  async down(q) {
    await q.sequelize.query('ALTER TABLE service_definitions DROP COLUMN description');
  },
};
