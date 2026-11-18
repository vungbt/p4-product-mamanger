'use strict';
/**
 * ST-25 part A: tenant portal links and sessions, and building announcements (read by the
 * portal; staff writes come with part B).
 *
 * - `tenant_portal_links`: one active link per occupant (`contract_id, tenant_id` unique while
 *   not revoked). Only the SHA-256 hash of the random token is stored. Wrong "last 4 phone digits"
 *   count in `failed_attempts`; the fifth locks the link (`locked_until`).
 * - `tenant_portal_sessions`: a verified device; only the SHA-256 hash of the cookie value is
 *   stored. Revoking a link deletes its sessions.
 * - `announcements`: building notices (`room_ids` null = the whole building).
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE tenant_portal_links (
        id uuid PRIMARY KEY,
        building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
        contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
        token_hash char(64) NOT NULL,
        created_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        revoked_at timestamptz,
        revoked_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
        locked_until timestamptz,
        last_opened_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX tenant_portal_links_token_hash_key ON tenant_portal_links (token_hash);
      CREATE UNIQUE INDEX tenant_portal_links_active_key
        ON tenant_portal_links (contract_id, tenant_id) WHERE revoked_at IS NULL;
      CREATE INDEX tenant_portal_links_contract_idx ON tenant_portal_links (contract_id, created_at);

      CREATE TABLE tenant_portal_sessions (
        id uuid PRIMARY KEY,
        link_id uuid NOT NULL REFERENCES tenant_portal_links(id) ON DELETE CASCADE,
        session_hash char(64) NOT NULL,
        expires_at timestamptz NOT NULL,
        user_agent varchar(255),
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX tenant_portal_sessions_hash_key ON tenant_portal_sessions (session_hash);
      CREATE INDEX tenant_portal_sessions_link_idx ON tenant_portal_sessions (link_id);
      CREATE INDEX tenant_portal_sessions_expires_idx ON tenant_portal_sessions (expires_at);

      CREATE TABLE announcements (
        id uuid PRIMARY KEY,
        building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
        title varchar(200) NOT NULL CHECK (length(trim(title)) > 0),
        body text NOT NULL,
        room_ids uuid[],
        pinned boolean NOT NULL DEFAULT false,
        expires_at timestamptz,
        created_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX announcements_building_idx ON announcements (building_id, pinned, created_at);
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS announcements;
      DROP TABLE IF EXISTS tenant_portal_sessions;
      DROP TABLE IF EXISTS tenant_portal_links;
    `);
  },
};
