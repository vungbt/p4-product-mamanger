'use strict';
/**
 * ST-09: private uploads (CCCD photos; later meter photos and receipts). The browser uploads
 * straight to the storage provider with a signed ticket; `complete` verifies the stored object and
 * creates the `files` row. Private files are only served through signed, short-lived URLs.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE files (
          id uuid PRIMARY KEY,
          -- 'stub' only outside production when Cloudinary is not configured (tests, CI).
          provider varchar(16) NOT NULL CHECK (provider IN ('cloudinary', 'stub')),
          storage_id varchar(255) NOT NULL UNIQUE,
          private boolean NOT NULL DEFAULT true,
          format varchar(8) NOT NULL CHECK (format IN ('jpg', 'png', 'webp')),
          bytes integer NOT NULL CHECK (bytes > 0),
          width integer CHECK (width > 0),
          height integer CHECK (height > 0),
          purpose varchar(32) NOT NULL,
          owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
          building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX files_building_id_idx ON files (building_id);

        CREATE TABLE upload_tickets (
          id uuid PRIMARY KEY,
          owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
          purpose varchar(32) NOT NULL,
          provider varchar(16) NOT NULL CHECK (provider IN ('cloudinary', 'stub')),
          storage_id varchar(255) NOT NULL UNIQUE,
          status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
          max_bytes integer NOT NULL CHECK (max_bytes > 0),
          expires_at timestamptz NOT NULL,
          file_id uuid REFERENCES files(id) ON DELETE SET NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          CHECK (status = 'completed' OR file_id IS NULL)
        );
        CREATE INDEX upload_tickets_owner_id_idx ON upload_tickets (owner_id, created_at);
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TABLE upload_tickets; DROP TABLE files;');
  },
};
