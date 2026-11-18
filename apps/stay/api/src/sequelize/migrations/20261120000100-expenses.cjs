'use strict';
const { randomUUID } = require('node:crypto');

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE expense_categories (
          id uuid PRIMARY KEY,
          name varchar(120) NOT NULL CHECK (length(trim(name)) > 0),
          active boolean NOT NULL DEFAULT true,
          version integer NOT NULL DEFAULT 1,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX expense_categories_name_key ON expense_categories (lower(name));
        CREATE TABLE expenses (
          id uuid PRIMARY KEY,
          building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
          room_id uuid REFERENCES rooms(id) ON DELETE RESTRICT,
          category_id uuid NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
          amount bigint NOT NULL CHECK (amount > 0 AND amount <= 9007199254740991),
          spent_on date NOT NULL,
          period char(7) NOT NULL CHECK (period = to_char(spent_on, 'YYYY-MM')),
          note text,
          receipt_file_id uuid REFERENCES files(id) ON DELETE RESTRICT,
          version integer NOT NULL DEFAULT 1,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX expenses_building_period_idx ON expenses (building_id, period);
        CREATE INDEX expenses_category_idx ON expenses (category_id);
        CREATE INDEX expenses_room_idx ON expenses (room_id);
      `,
        { transaction },
      );
      await queryInterface.bulkInsert(
        'expense_categories',
        ['Điện nước tổng', 'Sửa chữa', 'Internet tổng', 'Vệ sinh', 'Thuế phí', 'Khác'].map(
          (name) => ({ id: randomUUID(), name }),
        ),
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE expenses; DROP TABLE expense_categories;');
  },
};
