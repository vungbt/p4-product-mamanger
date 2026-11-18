'use strict';
/**
 * ST-09: tenant profiles, their CCCD images and vehicles. Personal data: only the owner and the
 * managers of the tenant's building read it; the CCCD is unique when present and never logged.
 * Tenants are archived, not deleted. Occupancy comes from contracts (ST-10).
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE tenants (
          id uuid PRIMARY KEY,
          building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
          full_name varchar(120) NOT NULL CHECK (btrim(full_name) <> ''),
          phone varchar(10) NOT NULL CHECK (phone ~ '^0[0-9]{9}$'),
          email varchar(255),
          id_number varchar(12) CHECK (id_number ~ '^[0-9]{12}$'),
          id_issued_at date,
          birth_date date,
          gender varchar(8) CHECK (gender IN ('male', 'female', 'other')),
          hometown varchar(255),
          permanent_address varchar(255),
          occupation varchar(255),
          note text,
          archived_at timestamptz,
          version integer NOT NULL DEFAULT 1,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX tenants_id_number_key ON tenants (id_number) WHERE id_number IS NOT NULL;
        CREATE INDEX tenants_phone_idx ON tenants (phone);
        CREATE INDEX tenants_building_id_idx ON tenants (building_id, full_name);

        CREATE TABLE tenant_documents (
          id uuid PRIMARY KEY,
          tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          file_id uuid NOT NULL UNIQUE REFERENCES files(id) ON DELETE RESTRICT,
          kind varchar(16) NOT NULL CHECK (kind IN ('id_front', 'id_back', 'other')),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        -- One front and one back image per tenant; 'other' documents are not limited.
        CREATE UNIQUE INDEX tenant_documents_side_key ON tenant_documents (tenant_id, kind)
          WHERE kind IN ('id_front', 'id_back');

        CREATE TABLE vehicles (
          id uuid PRIMARY KEY,
          tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
          plate varchar(16) NOT NULL CHECK (btrim(plate) <> ''),
          -- Plate without separators, for uniqueness: '59-X1 123.45' = '59X112345'.
          plate_key varchar(16) NOT NULL,
          type varchar(16) NOT NULL
            CHECK (type IN ('motorbike', 'electric_bike', 'bicycle', 'car', 'other')),
          note varchar(255),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (tenant_id, plate_key)
        );
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP TABLE vehicles; DROP TABLE tenant_documents; DROP TABLE tenants;',
    );
  },
};
