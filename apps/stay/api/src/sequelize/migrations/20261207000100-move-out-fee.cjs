'use strict';
/**
 * Move-out facility depreciation fee (rules.md "Trả phòng và thanh lý"): added as a settlement
 * surcharge the owner can edit or remove. System default in `system_settings` (key `billing`,
 * `moveOutFee`, 300.000đ); buildings override with a nullable column (`null` = follow the
 * system, 0 = off).
 */
module.exports = {
  async up(q) {
    await q.sequelize.transaction(async (transaction) => {
      await q.sequelize.query(
        `
        ALTER TABLE buildings
          ADD COLUMN move_out_fee integer CHECK (move_out_fee BETWEEN 0 AND 100000000);

        UPDATE system_settings
          SET value = jsonb_build_object('moveOutFee', 300000) || value
          WHERE key = 'billing';
      `,
        { transaction },
      );
    });
  },
  async down(q) {
    await q.sequelize.transaction(async (transaction) => {
      await q.sequelize.query(
        `
        UPDATE system_settings SET value = value - 'moveOutFee' WHERE key = 'billing';
        ALTER TABLE buildings DROP COLUMN move_out_fee;
      `,
        { transaction },
      );
    });
  },
};
