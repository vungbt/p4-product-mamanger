'use strict';
/**
 * ST-30a online contracts.
 *
 * - `landlord_profiles`: "Bên cho thuê" of an owner account; the saved signature is a private
 *   image stored in the row (never a public URL).
 * - `contract_templates` / `contract_template_versions`: versions are never updated; saving creates
 *   a new version and moves `active_version_id`.
 * - `contract_documents`: a filled body (snapshot of the contract data when created). Once it left
 *   `draft`, a trigger refuses any change of the body or its hashes, and the final PDF can never
 *   be replaced.
 * - `document_signers`: one row per signer (tenant occupants through the portal, the owner).
 *   Tenants sign inside their ST-25 portal session; the signer row holds the 14-day expiry and the
 *   "last 4 digits" lock instead of a separate token.
 * - `document_events` (evidence log) and `document_files` (final PDF, paper scan) are append-only:
 *   triggers refuse UPDATE and DELETE. Files live in Postgres so they commit with the status
 *   change and are only served by authorised routes.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE landlord_profiles (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
        full_name varchar(120) NOT NULL CHECK (length(trim(full_name)) > 0),
        birth_date date,
        id_number varchar(12),
        id_issued_at date,
        id_issued_by varchar(120),
        permanent_address varchar(255),
        phone varchar(20),
        signature_image bytea,
        signature_format varchar(8) CHECK (signature_format IN ('png', 'jpg')),
        signature_updated_at timestamptz,
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK ((signature_image IS NULL) = (signature_format IS NULL))
      );

      CREATE TABLE contract_templates (
        id uuid PRIMARY KEY,
        building_id uuid REFERENCES buildings(id) ON DELETE RESTRICT,
        kind varchar(16) NOT NULL CHECK (kind IN ('contract', 'addendum', 'handover', 'settlement')),
        name varchar(160) NOT NULL CHECK (length(trim(name)) > 0),
        active_version_id uuid,
        active boolean NOT NULL DEFAULT true,
        created_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX contract_templates_building_idx ON contract_templates (building_id, kind);

      CREATE TABLE contract_template_versions (
        id uuid PRIMARY KEY,
        template_id uuid NOT NULL REFERENCES contract_templates(id) ON DELETE RESTRICT,
        version integer NOT NULL CHECK (version > 0),
        body_html text NOT NULL,
        variables_used text[] NOT NULL DEFAULT '{}',
        note varchar(255),
        created_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (template_id, version)
      );
      ALTER TABLE contract_templates ADD CONSTRAINT contract_templates_active_version_fk
        FOREIGN KEY (active_version_id) REFERENCES contract_template_versions(id)
        DEFERRABLE INITIALLY DEFERRED;

      CREATE TABLE document_files (
        id uuid PRIMARY KEY,
        building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
        purpose varchar(16) NOT NULL CHECK (purpose IN ('final_pdf', 'paper_scan')),
        format varchar(8) NOT NULL CHECK (format IN ('pdf', 'png', 'jpg')),
        bytes integer NOT NULL CHECK (bytes > 0),
        sha256 char(64) NOT NULL,
        content bytea NOT NULL,
        created_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE contract_documents (
        id uuid PRIMARY KEY,
        building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
        contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
        kind varchar(16) NOT NULL CHECK (kind IN ('contract', 'addendum', 'handover', 'settlement')),
        template_version_id uuid REFERENCES contract_template_versions(id) ON DELETE RESTRICT,
        landlord_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        code varchar(16) NOT NULL UNIQUE,
        title varchar(200) NOT NULL,
        body_html text NOT NULL,
        data_snapshot jsonb NOT NULL,
        data_sha256 char(64),
        edited_manually boolean NOT NULL DEFAULT false,
        status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'owner_signed',
          'sent', 'viewed', 'signed_by_tenant', 'completed', 'rejected', 'cancelled',
          'completed_paper', 'superseded', 'expired')),
        signing_order varchar(16) NOT NULL DEFAULT 'tenant_first'
          CHECK (signing_order IN ('tenant_first', 'owner_first')),
        pdf_file_id uuid REFERENCES document_files(id) ON DELETE RESTRICT,
        pdf_sha256 char(64),
        paper_scan_file_id uuid REFERENCES document_files(id) ON DELETE RESTRICT,
        paper_signed_on date,
        supersedes_id uuid REFERENCES contract_documents(id) ON DELETE RESTRICT,
        cancel_reason text,
        sent_at timestamptz,
        completed_at timestamptz,
        created_by uuid REFERENCES users(id) ON DELETE RESTRICT,
        version integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK (status <> 'completed' OR (pdf_file_id IS NOT NULL AND pdf_sha256 IS NOT NULL)),
        CHECK (status <> 'completed_paper' OR paper_scan_file_id IS NOT NULL),
        CHECK (status <> 'cancelled' OR cancel_reason IS NOT NULL),
        CHECK (status = 'draft' OR data_sha256 IS NOT NULL)
      );
      CREATE INDEX contract_documents_contract_idx ON contract_documents (contract_id, created_at);
      CREATE INDEX contract_documents_template_idx ON contract_documents (template_version_id);
      CREATE UNIQUE INDEX contract_documents_supersedes_key ON contract_documents (supersedes_id)
        WHERE supersedes_id IS NOT NULL AND status NOT IN ('cancelled', 'rejected');

      CREATE TABLE document_signers (
        id uuid PRIMARY KEY,
        document_id uuid NOT NULL REFERENCES contract_documents(id) ON DELETE RESTRICT,
        role varchar(8) NOT NULL CHECK (role IN ('tenant', 'owner')),
        tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT,
        user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
        name varchar(120) NOT NULL,
        required boolean NOT NULL DEFAULT true,
        sort_order integer NOT NULL DEFAULT 0,
        expires_at timestamptz,
        failed_attempts integer NOT NULL DEFAULT 0,
        locked_until timestamptz,
        status varchar(10) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'viewed', 'signed', 'rejected')),
        viewed_at timestamptz,
        signed_at timestamptz,
        signature_method varchar(8) CHECK (signature_method IN ('drawn', 'typed', 'stored')),
        signature_image bytea,
        signature_format varchar(8) CHECK (signature_format IN ('png', 'jpg')),
        typed_name varchar(120),
        reject_reason text,
        signed_data_sha256 char(64),
        verification varchar(32),
        ip varchar(64),
        user_agent varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CHECK ((role = 'tenant') = (tenant_id IS NOT NULL)),
        CHECK (role <> 'owner' OR user_id IS NOT NULL),
        CHECK (status <> 'signed' OR (signed_at IS NOT NULL AND signed_data_sha256 IS NOT NULL
          AND signature_method IS NOT NULL)),
        CHECK (status <> 'rejected' OR reject_reason IS NOT NULL)
      );
      CREATE UNIQUE INDEX document_signers_tenant_key ON document_signers (document_id, tenant_id)
        WHERE tenant_id IS NOT NULL;
      CREATE UNIQUE INDEX document_signers_owner_key ON document_signers (document_id)
        WHERE role = 'owner';
      CREATE INDEX document_signers_tenant_idx ON document_signers (tenant_id);

      CREATE TABLE document_events (
        id uuid PRIMARY KEY,
        document_id uuid NOT NULL REFERENCES contract_documents(id) ON DELETE RESTRICT,
        signer_id uuid REFERENCES document_signers(id) ON DELETE RESTRICT,
        type varchar(24) NOT NULL,
        actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
        actor_name varchar(120),
        ip varchar(64),
        user_agent varchar(255),
        data_sha256 char(64),
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX document_events_document_idx ON document_events (document_id, created_at);

      CREATE FUNCTION stay_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = 'restrict_violation';
      END $$;
      CREATE TRIGGER document_events_append_only BEFORE UPDATE OR DELETE ON document_events
        FOR EACH ROW EXECUTE FUNCTION stay_append_only();
      CREATE TRIGGER document_files_append_only BEFORE UPDATE OR DELETE ON document_files
        FOR EACH ROW EXECUTE FUNCTION stay_append_only();

      -- The body is frozen once the document left draft; the final PDF is set once.
      CREATE FUNCTION stay_contract_document_guard() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF OLD.status <> 'draft' AND (NEW.body_html IS DISTINCT FROM OLD.body_html
            OR NEW.data_sha256 IS DISTINCT FROM OLD.data_sha256
            OR NEW.data_snapshot IS DISTINCT FROM OLD.data_snapshot) THEN
          RAISE EXCEPTION 'contract document body is frozen' USING ERRCODE = 'restrict_violation';
        END IF;
        IF OLD.pdf_file_id IS NOT NULL AND (NEW.pdf_file_id IS DISTINCT FROM OLD.pdf_file_id
            OR NEW.pdf_sha256 IS DISTINCT FROM OLD.pdf_sha256) THEN
          RAISE EXCEPTION 'final PDF is immutable' USING ERRCODE = 'restrict_violation';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER contract_documents_guard BEFORE UPDATE ON contract_documents
        FOR EACH ROW EXECUTE FUNCTION stay_contract_document_guard();
      CREATE TRIGGER contract_documents_no_delete BEFORE DELETE ON contract_documents
        FOR EACH ROW EXECUTE FUNCTION stay_append_only();
    `);
  },
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS document_events;
      DROP TABLE IF EXISTS document_signers;
      DROP TABLE IF EXISTS contract_documents;
      DROP TABLE IF EXISTS document_files;
      DROP FUNCTION IF EXISTS stay_contract_document_guard();
      DROP FUNCTION IF EXISTS stay_append_only();
      ALTER TABLE IF EXISTS contract_templates
        DROP CONSTRAINT IF EXISTS contract_templates_active_version_fk;
      DROP TABLE IF EXISTS contract_template_versions;
      DROP TABLE IF EXISTS contract_templates;
      DROP TABLE IF EXISTS landlord_profiles;
    `);
  },
};
