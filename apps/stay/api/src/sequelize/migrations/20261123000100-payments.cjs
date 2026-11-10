'use strict';
/**
 * ST-15: payments of issued invoices. Never edited or deleted: a mistake is corrected by
 * reversing (`reversed_at`, `reverse_reason`, `reversed_by`); `invoices.paid_total` is the sum of
 * non-reversed payments, updated in the same transaction. Money is BIGINT VND.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE payments (
        id uuid PRIMARY KEY,
        invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
        building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
        amount bigint NOT NULL CHECK (amount > 0),
        method varchar(16) NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'other')),
        paid_on date NOT NULL,
        reference varchar(120),
        note text,
        reversed_at timestamptz,
        reverse_reason text,
        reversed_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        actor_id uuid REFERENCES users(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        CHECK (
          (reversed_at IS NULL AND reverse_reason IS NULL AND reversed_by IS NULL)
          OR (reversed_at IS NOT NULL AND length(trim(reverse_reason)) > 0)
        )
      );
      CREATE INDEX payments_invoice_idx ON payments (invoice_id);
      CREATE INDEX payments_building_paid_on_idx ON payments (building_id, paid_on);
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS payments;');
  },
};
