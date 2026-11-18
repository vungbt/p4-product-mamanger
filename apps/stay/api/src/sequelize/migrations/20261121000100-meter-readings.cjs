'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE meter_readings (
        id uuid PRIMARY KEY,
        meter_id uuid NOT NULL REFERENCES meters(id) ON DELETE RESTRICT,
        period char(7) NOT NULL CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
        reading bigint NOT NULL CHECK (reading >= 0 AND reading <= 999999999),
        read_on date NOT NULL CHECK (to_char(read_on, 'YYYY-MM') = period),
        photo_file_id uuid REFERENCES files(id) ON DELETE RESTRICT,
        status varchar(8) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'locked')),
        version integer NOT NULL DEFAULT 1 CHECK (version > 0),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (meter_id, period)
      );
    `);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('meter_readings');
  },
};
