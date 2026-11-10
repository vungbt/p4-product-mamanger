'use strict';
module.exports = {
  async up(q) {
    await q.sequelize.query(`
      CREATE TABLE invoices (
        id uuid PRIMARY KEY, building_id uuid NOT NULL REFERENCES buildings(id),
        contract_id uuid NOT NULL REFERENCES contracts(id), room_id uuid NOT NULL REFERENCES rooms(id),
        kind varchar(12) NOT NULL CHECK (kind IN ('monthly','move_in','settlement')),
        period char(7) NOT NULL CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
        code varchar(80) UNIQUE, status varchar(16) NOT NULL DEFAULT 'draft'
          CHECK (status IN ('draft','issued','partially_paid','paid','void')),
        issued_on date, due_on date NOT NULL, subtotal bigint NOT NULL,
        rounding bigint NOT NULL, total bigint NOT NULL, paid_total bigint NOT NULL DEFAULT 0,
        rounding_unit bigint NOT NULL CHECK (rounding_unit > 0), share_token_hash text,
        void_reason text, version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (total = subtotal + rounding), CHECK (paid_total >= 0),
        CHECK (status <> 'void' OR (paid_total = 0 AND length(trim(void_reason)) > 0))
      );
      CREATE UNIQUE INDEX invoices_monthly_unique ON invoices(contract_id, period)
        WHERE kind = 'monthly' AND status <> 'void';
      CREATE UNIQUE INDEX invoices_move_in_unique ON invoices(contract_id)
        WHERE kind = 'move_in' AND status <> 'void';
      CREATE INDEX invoices_building_period ON invoices(building_id, period);
      CREATE TABLE invoice_lines (
        id uuid PRIMARY KEY, invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        type varchar(16) NOT NULL, service_id uuid REFERENCES service_definitions(id),
        description jsonb NOT NULL, period char(7), quantity integer NOT NULL,
        unit varchar(80), unit_price bigint, ratio_num integer, ratio_den integer,
        amount bigint NOT NULL, meta jsonb NOT NULL, position integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE invoice_sequences (
        id uuid PRIMARY KEY, building_id uuid NOT NULL REFERENCES buildings(id),
        period char(7) NOT NULL, last_number integer NOT NULL CHECK(last_number BETWEEN 0 AND 999),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(building_id, period)
      );
      CREATE TABLE invoice_meter_readings (
        invoice_id uuid NOT NULL REFERENCES invoices(id), reading_id uuid NOT NULL REFERENCES meter_readings(id),
        reading_value bigint NOT NULL, PRIMARY KEY(invoice_id, reading_id)
      );
      ALTER TABLE deposit_entries ADD CONSTRAINT deposit_entries_invoice_fk
        FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT;
    `);
  },
  async down(q) {
    await q.sequelize.query(`ALTER TABLE deposit_entries DROP CONSTRAINT deposit_entries_invoice_fk;
      DROP TABLE invoice_meter_readings, invoice_sequences, invoice_lines, invoices;`);
  },
};
