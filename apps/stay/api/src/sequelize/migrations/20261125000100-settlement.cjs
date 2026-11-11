'use strict';
/**
 * ST-17: move-out and settlement.
 * - `payments.method` gains `deposit`: settlement records the deposit offset as a payment on each
 *   invoice it pays (earlier unpaid invoices keep their payments on the original invoice).
 * - One non-void settlement invoice per contract.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
        ALTER TABLE payments ADD CONSTRAINT payments_method_check
          CHECK (method IN ('cash', 'bank_transfer', 'other', 'deposit'));
        CREATE UNIQUE INDEX invoices_settlement_contract_key
          ON invoices (contract_id) WHERE kind = 'settlement' AND status <> 'void';
        `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS invoices_settlement_contract_key;
        ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
        ALTER TABLE payments ADD CONSTRAINT payments_method_check
          CHECK (method IN ('cash', 'bank_transfer', 'other'));
        `,
        { transaction },
      );
    });
  },
};
