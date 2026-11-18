'use strict';
module.exports = {
  async up(q) {
    await q.sequelize.query(`
      ALTER TABLE contract_occupants
        ADD COLUMN registered_on date,
        ADD COLUMN registration_note varchar(2000),
        ADD COLUMN registered_by uuid REFERENCES users(id) ON DELETE SET NULL;
    `);
  },
  async down(q) {
    await q.sequelize.query(`ALTER TABLE contract_occupants
      DROP COLUMN registered_by, DROP COLUMN registration_note, DROP COLUMN registered_on`);
  },
};
