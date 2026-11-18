'use strict';
/**
 * ST-14: invoices, snapshot lines, per building/period code sequences and the meter readings an
 * invoice used (locked on issue, unlocked on void). Money is BIGINT VND.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE invoices (
          id uuid PRIMARY KEY,
          building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
          contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
          room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
          kind varchar(12) NOT NULL CHECK (kind IN ('move_in', 'monthly', 'settlement')),
          period char(7) NOT NULL CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
          code varchar(32) UNIQUE,
          status varchar(16) NOT NULL DEFAULT 'draft'
            CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'void')),
          issued_on date,
          due_on date NOT NULL,
          subtotal bigint NOT NULL,
          rounding bigint NOT NULL,
          total bigint NOT NULL,
          paid_total bigint NOT NULL DEFAULT 0 CHECK (paid_total >= 0),
          rounding_unit bigint NOT NULL CHECK (rounding_unit > 0),
          share_token_hash varchar(128),
          void_reason text,
          voided_at timestamptz,
          version integer NOT NULL DEFAULT 1 CHECK (version > 0),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          CHECK (total = subtotal + rounding),
          CHECK (status <> 'draft' OR code IS NULL),
          CHECK (status IN ('draft', 'void') OR (code IS NOT NULL AND issued_on IS NOT NULL)),
          CHECK (status <> 'void' OR (paid_total = 0 AND length(trim(void_reason)) > 0))
        );
        CREATE UNIQUE INDEX invoices_monthly_contract_period_key
          ON invoices (contract_id, period, kind) WHERE kind = 'monthly' AND status <> 'void';
        CREATE UNIQUE INDEX invoices_move_in_contract_key
          ON invoices (contract_id) WHERE kind = 'move_in' AND status <> 'void';
        CREATE INDEX invoices_building_period_idx ON invoices (building_id, period);
        CREATE INDEX invoices_status_due_on_idx ON invoices (status, due_on);
        CREATE INDEX invoices_room_idx ON invoices (room_id);
        CREATE INDEX invoices_contract_idx ON invoices (contract_id);

        CREATE TABLE invoice_lines (
          id uuid PRIMARY KEY,
          invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          position integer NOT NULL CHECK (position >= 0),
          type varchar(16) NOT NULL CHECK (type IN ('rent', 'service', 'electricity', 'water',
            'surcharge', 'discount', 'adjustment', 'refund', 'deposit', 'rounding')),
          service_id uuid REFERENCES service_definitions(id) ON DELETE RESTRICT,
          description jsonb NOT NULL,
          period char(7) CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
          quantity integer NOT NULL,
          unit varchar(32),
          unit_price bigint,
          ratio_num integer,
          ratio_den integer CHECK (ratio_den IS NULL OR ratio_den > 0),
          amount bigint NOT NULL,
          manual boolean NOT NULL DEFAULT false,
          meta jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX invoice_lines_invoice_idx ON invoice_lines (invoice_id, position);

        CREATE TABLE invoice_sequences (
          id uuid PRIMARY KEY,
          building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
          period char(7) NOT NULL CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
          last_number integer NOT NULL DEFAULT 0 CHECK (last_number BETWEEN 0 AND 999),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (building_id, period)
        );

        CREATE TABLE invoice_meter_readings (
          invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          reading_id uuid NOT NULL REFERENCES meter_readings(id) ON DELETE RESTRICT,
          reading_value bigint NOT NULL,
          PRIMARY KEY (invoice_id, reading_id)
        );
        CREATE INDEX invoice_meter_readings_reading_idx ON invoice_meter_readings (reading_id);

        ALTER TABLE deposit_entries ADD CONSTRAINT deposit_entries_invoice_id_fkey
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT;
        `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE deposit_entries DROP CONSTRAINT IF EXISTS deposit_entries_invoice_id_fkey;
      DROP TABLE IF EXISTS invoice_meter_readings, invoice_sequences, invoice_lines, invoices;
    `);
  },
};
