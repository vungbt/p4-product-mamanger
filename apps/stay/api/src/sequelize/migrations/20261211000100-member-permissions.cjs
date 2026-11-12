'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE users
      ADD COLUMN permission_groups text[] NOT NULL DEFAULT ARRAY['operations','readings','payments','billing']::text[],
      ADD COLUMN version integer NOT NULL DEFAULT 0,
      ADD CONSTRAINT users_permission_groups CHECK (permission_groups <@ ARRAY['operations','readings','payments','billing']::text[]);`);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`ALTER TABLE users DROP CONSTRAINT users_permission_groups,
      DROP COLUMN permission_groups, DROP COLUMN version;`);
  },
};
