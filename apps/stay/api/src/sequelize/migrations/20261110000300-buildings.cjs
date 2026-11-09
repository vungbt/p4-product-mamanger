'use strict';
/**
 * Minimal `buildings` (ST-07 adds address, billing days, bank account…) so `building_members`
 * can reference it. Buildings are archived, never deleted.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE buildings (
          id uuid PRIMARY KEY,
          code varchar(16) NOT NULL CHECK (code ~ '^[A-Z0-9]+$'),
          name varchar(255) NOT NULL,
          archived_at timestamptz,
          version integer NOT NULL DEFAULT 1,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX buildings_code_key ON buildings (code);

        CREATE TABLE building_members (
          id uuid PRIMARY KEY,
          building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role varchar(32) NOT NULL DEFAULT 'manager' CHECK (role IN ('manager')),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (building_id, user_id)
        );
        CREATE INDEX building_members_user_idx ON building_members (user_id);
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE building_members, buildings;');
  },
};
