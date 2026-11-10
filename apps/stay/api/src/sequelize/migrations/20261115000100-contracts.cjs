'use strict';
module.exports = {
  async up(q) {
    await q.sequelize.transaction(async (transaction) => {
      await q.sequelize.query(
        `
CREATE TABLE contracts (
 id uuid PRIMARY KEY, building_id uuid NOT NULL REFERENCES buildings(id),
 room_id uuid NOT NULL REFERENCES rooms(id), code varchar(32) NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','ending','ended','cancelled')),
 start_date date NOT NULL, end_date date CHECK (end_date >= start_date),
 notice_date date, moved_out_at date,
 rent bigint NOT NULL CHECK (rent >= 0), deposit_amount bigint NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
 deposit_collected boolean NOT NULL DEFAULT false,
 deposit_method varchar(16) NOT NULL DEFAULT 'cash' CHECK (deposit_method IN ('cash','bank_transfer','other')),
 deposit_note text, initial_electric_photo_file_id uuid REFERENCES files(id), initial_water_photo_file_id uuid REFERENCES files(id),
 deposit_date date, initial_electric bigint NOT NULL DEFAULT 0 CHECK (initial_electric >= 0),
 initial_water bigint NOT NULL DEFAULT 0 CHECK (initial_water >= 0), note text,
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(building_id, code)
);
CREATE UNIQUE INDEX contracts_one_holding_room ON contracts(room_id) WHERE status IN ('active','ending');
CREATE INDEX contracts_building_status_end ON contracts(building_id,status,end_date);
CREATE TABLE contract_occupants (
 id uuid PRIMARY KEY, contract_id uuid NOT NULL REFERENCES contracts(id), tenant_id uuid NOT NULL REFERENCES tenants(id),
 is_primary boolean NOT NULL DEFAULT false, from_date date NOT NULL, to_date date CHECK(to_date >= from_date),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(contract_id,tenant_id,from_date)
);
CREATE UNIQUE INDEX contract_one_primary ON contract_occupants(contract_id) WHERE is_primary AND to_date IS NULL;
CREATE INDEX contract_occupants_tenant ON contract_occupants(tenant_id);
CREATE TABLE contract_services (
 id uuid PRIMARY KEY, contract_id uuid NOT NULL REFERENCES contracts(id), service_id uuid NOT NULL REFERENCES service_definitions(id),
 from_date date NOT NULL, to_date date CHECK(to_date >= from_date),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(contract_id,service_id,from_date)
);
CREATE TABLE contract_vehicles (
 id uuid PRIMARY KEY, contract_id uuid NOT NULL REFERENCES contracts(id), vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
 from_date date NOT NULL, to_date date CHECK(to_date >= from_date),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(contract_id,vehicle_id,from_date)
);
CREATE TABLE contract_events (
 id uuid PRIMARY KEY, contract_id uuid NOT NULL REFERENCES contracts(id), type varchar(32) NOT NULL,
 payload jsonb NOT NULL DEFAULT '{}', actor_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE deposit_entries (
 id uuid PRIMARY KEY, contract_id uuid NOT NULL REFERENCES contracts(id),
 type varchar(16) NOT NULL CHECK(type IN ('received','applied','refunded','forfeited')),
 amount bigint NOT NULL CHECK(amount > 0), method varchar(16) NOT NULL CHECK(method IN ('cash','bank_transfer','other')),
 occurred_on date NOT NULL, note text, invoice_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX deposit_entries_contract ON deposit_entries(contract_id);
`,
        { transaction },
      );
    });
  },
  async down(q) {
    await q.sequelize.query(
      'DROP TABLE deposit_entries, contract_events, contract_vehicles, contract_services, contract_occupants, contracts;',
    );
  },
};
