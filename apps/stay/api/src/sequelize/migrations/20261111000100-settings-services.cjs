'use strict';
/**
 * ST-06: system billing settings and the service catalogue, with the default services and
 * prices of documents/stay/rules.md. Services are deactivated, never deleted.
 */
const { randomUUID } = require('node:crypto');

const DEFAULT_SERVICES = [
  ['electricity', 'Điện', 'electricity', 'kWh', 3500],
  ['water', 'Nước', 'water', 'm³', 20000],
  ['internet', 'Internet', 'per_room', 'phòng', 100000],
  ['garbage', 'Rác', 'per_room', 'phòng', 30000],
  ['common_fee', 'Phí chung', 'per_person', 'người', 50000],
  ['parking', 'Gửi xe', 'per_vehicle', 'xe', 100000],
];

const BILLING_DEFAULTS = {
  readingDay: 31,
  issueDay: 1,
  dueDay: 5,
  roundingUnit: 1000,
  refundUnusedRent: false,
  transferContentTemplate: '{invoiceCode}',
};

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE system_settings (
          id uuid PRIMARY KEY,
          key varchar(64) NOT NULL UNIQUE,
          value jsonb NOT NULL,
          version integer NOT NULL DEFAULT 1,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE service_definitions (
          id uuid PRIMARY KEY,
          code varchar(32) NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_]+$'),
          name varchar(120) NOT NULL CHECK (btrim(name) <> ''),
          kind varchar(16) NOT NULL
            CHECK (kind IN ('electricity', 'water', 'per_room', 'per_person', 'per_vehicle')),
          unit varchar(20) NOT NULL,
          default_price bigint NOT NULL CHECK (default_price >= 0),
          active boolean NOT NULL DEFAULT true,
          sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
          version integer NOT NULL DEFAULT 1,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX service_definitions_name_key ON service_definitions (lower(name));
        -- Metered services are read from one meter each: one active electricity, one active water.
        CREATE UNIQUE INDEX service_definitions_active_metered_key ON service_definitions (kind)
          WHERE active AND kind IN ('electricity', 'water');
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `INSERT INTO system_settings (id, key, value) VALUES (:id, 'billing', CAST(:value AS jsonb))`,
        {
          replacements: { id: randomUUID(), value: JSON.stringify(BILLING_DEFAULTS) },
          transaction,
        },
      );

      for (const [index, [code, name, kind, unit, price]] of DEFAULT_SERVICES.entries()) {
        await queryInterface.sequelize.query(
          `INSERT INTO service_definitions (id, code, name, kind, unit, default_price, sort_order)
           VALUES (:id, :code, :name, :kind, :unit, :price, :sortOrder)`,
          {
            replacements: {
              id: randomUUID(),
              code,
              name,
              kind,
              unit,
              price,
              sortOrder: (index + 1) * 10,
            },
            transaction,
          },
        );
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE service_definitions, system_settings;');
  },
};
