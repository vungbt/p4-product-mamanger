'use strict';
/**
 * Local/CI seed: sample address, bank account and tenant-facing info for building A (fake data).
 * Only fills a building A that has no address yet, so local edits are kept. Services and system
 * settings come from the migrations.
 */
module.exports = {
  async up(queryInterface) {
    if (process.env.NODE_ENV === 'production')
      throw new Error('The Stay seed is for local development and CI only.');

    await queryInterface.sequelize.query(
      `UPDATE buildings SET
         address = :address,
         bank_bin = '970436',
         bank_account = '0123456789',
         bank_account_name = 'NGUYEN VAN CHU',
         contact_phone = '0901234567',
         rules_text = :rules,
         updated_at = now()
       WHERE code = 'A' AND address IS NULL`,
      {
        replacements: {
          address: '12 Đường Số 1, Phường Bến Thành, TP. Hồ Chí Minh',
          rules:
            'Giữ yên lặng sau 22h.\nKhông nấu ăn ở hành lang.\nKhách ở qua đêm báo chủ trọ trước.',
        },
      },
    );
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE buildings SET address = NULL, bank_bin = NULL, bank_account = NULL,
         bank_account_name = NULL, contact_phone = NULL, rules_text = NULL
       WHERE code = 'A'`,
    );
  },
};
