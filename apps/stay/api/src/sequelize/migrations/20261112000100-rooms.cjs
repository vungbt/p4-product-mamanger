'use strict';
/**
 * ST-08: rooms, their default services and meters. Room status (vacant/reserved/occupied) is
 * derived from contracts (ST-10); only the maintenance switch is stored. Rooms are archived, never
 * deleted, and a code is unique among the building's active rooms. Each room gets one
 * electricity and one water meter; replacing a meter (ST-13) closes it and opens a new one.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE rooms (
          id uuid PRIMARY KEY,
          building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
          code varchar(12) NOT NULL CHECK (code ~ '^[A-Z0-9][A-Z0-9.-]*$'),
          floor smallint NOT NULL CHECK (floor BETWEEN 0 AND 99),
          area_m2 numeric(6, 2) CHECK (area_m2 > 0),
          list_price bigint NOT NULL CHECK (list_price >= 0),
          max_occupants smallint NOT NULL CHECK (max_occupants BETWEEN 1 AND 20),
          maintenance boolean NOT NULL DEFAULT false,
          maintenance_reason varchar(255),
          maintenance_until date,
          note text,
          archived_at timestamptz,
          version integer NOT NULL DEFAULT 1,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT rooms_maintenance_fields_check
            CHECK (maintenance OR (maintenance_reason IS NULL AND maintenance_until IS NULL))
        );
        CREATE UNIQUE INDEX rooms_building_code_key ON rooms (building_id, code)
          WHERE archived_at IS NULL;
        CREATE INDEX rooms_building_floor_idx ON rooms (building_id, floor, code);

        CREATE TABLE room_default_services (
          room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
          service_id uuid NOT NULL REFERENCES service_definitions(id) ON DELETE RESTRICT,
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (room_id, service_id)
        );

        CREATE TABLE meters (
          id uuid PRIMARY KEY,
          room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
          kind varchar(16) NOT NULL CHECK (kind IN ('electricity', 'water')),
          serial varchar(40),
          installed_on date NOT NULL,
          initial_reading bigint NOT NULL CHECK (initial_reading >= 0),
          removed_on date,
          final_reading bigint CHECK (final_reading >= initial_reading),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT meters_removal_check CHECK ((removed_on IS NULL) = (final_reading IS NULL)),
          CONSTRAINT meters_removed_after_install_check CHECK (removed_on >= installed_on)
        );
        -- One meter of each kind in service per room.
        CREATE UNIQUE INDEX meters_room_kind_active_key ON meters (room_id, kind)
          WHERE removed_on IS NULL;
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE meters, room_default_services, rooms;');
  },
};
