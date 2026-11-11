'use strict';
/**
 * ST-25 part B: what tenants send from the portal and the owner inbox.
 *
 * - `payment_claims`: "Tôi đã chuyển khoản" for an issued invoice. One `pending` claim per invoice;
 *   confirming creates a normal payment (`payment_id`), idempotent by claim. A retried portal
 *   submit with the same `Idempotency-Key` returns the same claim (unique per occupant).
 * - `maintenance_requests`: báo hỏng (`source` owner|tenant). ST-22 extends the internal workflow
 *   and costs (`cost_expense_id`). `photos` holds private file ids.
 * - `tenant_requests`: move-out, occupants, vehicles, other. Accepting runs the ST-12/ST-17
 *   contract change; `result` keeps the ids it created.
 * - Portal uploads: tickets and files may belong to a portal link instead of a staff user.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE upload_tickets ALTER COLUMN owner_id DROP NOT NULL;
      ALTER TABLE upload_tickets
        ADD COLUMN portal_link_id uuid REFERENCES tenant_portal_links(id) ON DELETE CASCADE,
        ADD CONSTRAINT upload_tickets_owner_check
          CHECK (owner_id IS NOT NULL OR portal_link_id IS NOT NULL);
      CREATE INDEX upload_tickets_portal_link_idx ON upload_tickets (portal_link_id, created_at)
        WHERE portal_link_id IS NOT NULL;
      ALTER TABLE files
        ADD COLUMN portal_link_id uuid REFERENCES tenant_portal_links(id) ON DELETE SET NULL;

      CREATE TABLE payment_claims (
        id uuid PRIMARY KEY,
        building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
        contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
        invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
        portal_link_id uuid REFERENCES tenant_portal_links(id) ON DELETE SET NULL,
        amount bigint NOT NULL CHECK (amount > 0),
        paid_on date NOT NULL,
        receipt_file_id uuid REFERENCES files(id) ON DELETE SET NULL,
        reference varchar(120),
        note text,
        status varchar(16) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
        payment_id uuid REFERENCES payments(id) ON DELETE RESTRICT,
        reject_reason text,
        handled_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        handled_at timestamptz,
        idempotency_key varchar(128),
        idempotency_hash char(64),
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (status <> 'confirmed' OR payment_id IS NOT NULL),
        CHECK (status <> 'rejected' OR reject_reason IS NOT NULL)
      );
      CREATE UNIQUE INDEX payment_claims_pending_key ON payment_claims (invoice_id)
        WHERE status = 'pending';
      CREATE UNIQUE INDEX payment_claims_idempotency_key
        ON payment_claims (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
      CREATE UNIQUE INDEX payment_claims_payment_key ON payment_claims (payment_id)
        WHERE payment_id IS NOT NULL;
      CREATE INDEX payment_claims_building_idx ON payment_claims (building_id, status, created_at);
      CREATE INDEX payment_claims_contract_idx ON payment_claims (contract_id, created_at);

      CREATE TABLE maintenance_requests (
        id uuid PRIMARY KEY,
        building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
        room_id uuid REFERENCES rooms(id) ON DELETE RESTRICT,
        contract_id uuid REFERENCES contracts(id) ON DELETE RESTRICT,
        tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT,
        portal_link_id uuid REFERENCES tenant_portal_links(id) ON DELETE SET NULL,
        source varchar(16) NOT NULL CHECK (source IN ('owner', 'tenant')),
        category varchar(32) NOT NULL
          CHECK (category IN ('electricity', 'water', 'appliance', 'other')),
        severity varchar(16) NOT NULL DEFAULT 'normal' CHECK (severity IN ('normal', 'urgent')),
        title varchar(200) NOT NULL CHECK (length(trim(title)) > 0),
        description text NOT NULL DEFAULT '',
        status varchar(16) NOT NULL DEFAULT 'new'
          CHECK (status IN ('new', 'open', 'in_progress', 'done', 'rejected', 'cancelled')),
        reply text,
        replied_at timestamptz,
        replied_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        handled_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        handled_at timestamptz,
        cost_expense_id uuid REFERENCES expenses(id) ON DELETE SET NULL,
        photos uuid[] NOT NULL DEFAULT '{}',
        created_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (source <> 'tenant' OR (contract_id IS NOT NULL AND tenant_id IS NOT NULL)),
        CHECK (cardinality(photos) <= 5)
      );
      CREATE INDEX maintenance_requests_building_idx
        ON maintenance_requests (building_id, status, created_at);
      CREATE INDEX maintenance_requests_contract_idx
        ON maintenance_requests (contract_id, created_at);

      CREATE TABLE tenant_requests (
        id uuid PRIMARY KEY,
        building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
        contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
        room_id uuid REFERENCES rooms(id) ON DELETE RESTRICT,
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
        portal_link_id uuid REFERENCES tenant_portal_links(id) ON DELETE SET NULL,
        type varchar(32) NOT NULL CHECK (type IN
          ('move_out', 'add_occupant', 'remove_occupant', 'add_vehicle', 'remove_vehicle', 'other')),
        payload jsonb NOT NULL,
        status varchar(16) NOT NULL DEFAULT 'new'
          CHECK (status IN ('new', 'accepted', 'rejected', 'cancelled')),
        reply text,
        result jsonb,
        handled_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        handled_at timestamptz,
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (status <> 'rejected' OR reply IS NOT NULL)
      );
      CREATE INDEX tenant_requests_building_idx ON tenant_requests (building_id, status, created_at);
      CREATE INDEX tenant_requests_contract_idx ON tenant_requests (contract_id, created_at);

      CREATE INDEX announcements_expires_idx ON announcements (building_id, expires_at);
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS announcements_expires_idx;
      DROP TABLE IF EXISTS tenant_requests;
      DROP TABLE IF EXISTS maintenance_requests;
      DROP TABLE IF EXISTS payment_claims;
      ALTER TABLE files DROP COLUMN IF EXISTS portal_link_id;
      DELETE FROM upload_tickets WHERE owner_id IS NULL;
      DROP INDEX IF EXISTS upload_tickets_portal_link_idx;
      ALTER TABLE upload_tickets DROP CONSTRAINT IF EXISTS upload_tickets_owner_check;
      ALTER TABLE upload_tickets DROP COLUMN IF EXISTS portal_link_id;
      ALTER TABLE upload_tickets ALTER COLUMN owner_id SET NOT NULL;
    `);
  },
};
