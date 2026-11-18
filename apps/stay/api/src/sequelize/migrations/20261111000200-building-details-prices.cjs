'use strict';
/**
 * ST-07: building details (address, billing cycle, bank account, tenant-facing info) and dated
 * per-building price overrides. Billing columns left `NULL` follow `system_settings`.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE buildings
          ALTER COLUMN code TYPE varchar(6),
          ADD CONSTRAINT buildings_name_check CHECK (btrim(name) <> ''),
          ADD COLUMN address varchar(255),
          ADD COLUMN reading_day smallint
            CHECK (reading_day BETWEEN 1 AND 28 OR reading_day = 31),
          ADD COLUMN issue_day smallint CHECK (issue_day BETWEEN 1 AND 28 OR issue_day = 31),
          ADD COLUMN due_day smallint CHECK (due_day BETWEEN 1 AND 28 OR due_day = 31),
          ADD COLUMN rounding_unit integer CHECK (rounding_unit IN (1, 100, 1000)),
          ADD COLUMN refund_unused_rent boolean,
          ADD COLUMN bank_bin varchar(6) CHECK (bank_bin ~ '^[0-9]{6}$'),
          ADD COLUMN bank_account varchar(19),
          ADD COLUMN bank_account_name varchar(50),
          ADD COLUMN rules_text text,
          ADD COLUMN contact_phone varchar(11),
          ADD CONSTRAINT buildings_bank_complete_check CHECK (
            (bank_bin IS NULL) = (bank_account IS NULL)
            AND (bank_bin IS NULL) = (bank_account_name IS NULL)
          );

        CREATE TABLE building_service_prices (
          id uuid PRIMARY KEY,
          building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
          service_id uuid NOT NULL REFERENCES service_definitions(id) ON DELETE RESTRICT,
          -- NULL: back to the service default price from effective_from.
          price bigint CHECK (price >= 0),
          effective_from date NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (building_id, service_id, effective_from)
        );
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `
      DROP TABLE building_service_prices;
      ALTER TABLE buildings
        DROP CONSTRAINT buildings_bank_complete_check,
        DROP CONSTRAINT buildings_name_check,
        DROP COLUMN address,
        DROP COLUMN reading_day,
        DROP COLUMN issue_day,
        DROP COLUMN due_day,
        DROP COLUMN rounding_unit,
        DROP COLUMN refund_unused_rent,
        DROP COLUMN bank_bin,
        DROP COLUMN bank_account,
        DROP COLUMN bank_account_name,
        DROP COLUMN rules_text,
        DROP COLUMN contact_phone,
        ALTER COLUMN code TYPE varchar(16);
    `,
    );
  },
};
