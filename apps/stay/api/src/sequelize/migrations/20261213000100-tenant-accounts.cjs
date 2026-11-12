'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE users ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;
        ALTER TABLE tenants ADD COLUMN user_id uuid UNIQUE REFERENCES users(id);

        ALTER TABLE tenant_portal_links ADD COLUMN account_user_id uuid REFERENCES users(id) ON DELETE CASCADE;
        DROP INDEX tenant_portal_links_active_key;
        CREATE UNIQUE INDEX tenant_portal_links_active_key ON tenant_portal_links(contract_id, tenant_id)
          WHERE revoked_at IS NULL AND account_user_id IS NULL;
        CREATE UNIQUE INDEX portal_account_contract ON tenant_portal_links(account_user_id, contract_id);

        -- Covers all creation paths, including imports and quick contract occupants. Existing
        -- profiles are provisioned lazily when staff first issue credentials.
        CREATE FUNCTION stay_tenant_account() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE account_uuid uuid;
        BEGIN
          IF NEW.user_id IS NULL THEN
            account_uuid := gen_random_uuid();
            INSERT INTO users(id,email,display_name,role,must_change_password)
            VALUES(account_uuid, COALESCE(NULLIF(lower(NEW.email), ''),
              'tenant-' || NEW.id::text || '@accounts.stay.invalid'), NEW.full_name, 'tenant', true);
            NEW.user_id := account_uuid;
          END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER tenants_account BEFORE INSERT ON tenants
          FOR EACH ROW EXECUTE FUNCTION stay_tenant_account();

        CREATE FUNCTION stay_tenant_identity_updated() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          UPDATE users SET email = COALESCE(NULLIF(lower(NEW.email), ''),
            'tenant-' || NEW.id::text || '@accounts.stay.invalid'), display_name = NEW.full_name,
            email_verified = CASE WHEN lower(NEW.email) IS DISTINCT FROM lower(OLD.email)
              THEN false ELSE email_verified END,
            updated_at = now() WHERE id = NEW.user_id AND role = 'tenant';
          RETURN NEW;
        END $$;
        CREATE TRIGGER tenants_identity_updated AFTER UPDATE OF email, full_name ON tenants
          FOR EACH ROW EXECUTE FUNCTION stay_tenant_identity_updated();

        CREATE FUNCTION stay_occupant_account() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE
          target tenants%ROWTYPE;
          account_uuid uuid;
        BEGIN
          SELECT * INTO target FROM tenants WHERE id = NEW.tenant_id FOR UPDATE;
          IF target.id IS NOT NULL AND target.user_id IS NULL THEN
            account_uuid := gen_random_uuid();
            INSERT INTO users(id,email,display_name,role,must_change_password)
            VALUES(account_uuid, COALESCE(NULLIF(lower(target.email), ''),
              'tenant-' || target.id::text || '@accounts.stay.invalid'), target.full_name, 'tenant', true);
            UPDATE tenants SET user_id = account_uuid WHERE id = target.id;
          END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER occupants_account BEFORE INSERT OR UPDATE OF tenant_id ON contract_occupants
          FOR EACH ROW EXECUTE FUNCTION stay_occupant_account();

        -- Better Auth verifies the current password before changing this hash. Issuing a
        -- temporary password sets the flag again in the same transaction after the hash write.
        CREATE FUNCTION stay_password_changed() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.provider_id = 'credential' AND NEW.password IS DISTINCT FROM OLD.password THEN
            UPDATE users SET must_change_password = false WHERE id = NEW.user_id;
          END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER account_password_changed AFTER UPDATE OF password ON auth_accounts
          FOR EACH ROW EXECUTE FUNCTION stay_password_changed();
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP TRIGGER tenants_identity_updated ON tenants;
        DROP FUNCTION stay_tenant_identity_updated();
        DROP TRIGGER occupants_account ON contract_occupants;
        DROP FUNCTION stay_occupant_account();
        DROP TRIGGER account_password_changed ON auth_accounts;
        DROP FUNCTION stay_password_changed();
        DROP TRIGGER tenants_account ON tenants;
        DROP FUNCTION stay_tenant_account();
        -- Keep request/upload foreign keys intact when rolling back after account usage.
        UPDATE tenant_portal_links SET revoked_at = COALESCE(revoked_at, now()), created_by = NULL,
          revoked_by = NULL WHERE account_user_id IS NOT NULL;
        DROP INDEX tenant_portal_links_active_key;
        ALTER TABLE tenant_portal_links DROP COLUMN account_user_id;
        CREATE UNIQUE INDEX tenant_portal_links_active_key ON tenant_portal_links(contract_id, tenant_id)
          WHERE revoked_at IS NULL;
        CREATE TEMP TABLE tenant_account_rollback ON COMMIT DROP AS SELECT user_id FROM tenants WHERE user_id IS NOT NULL;
        ALTER TABLE tenants DROP COLUMN user_id;
        DELETE FROM users WHERE role = 'tenant' AND id IN (SELECT user_id FROM tenant_account_rollback);
        ALTER TABLE users DROP COLUMN must_change_password;
      `,
        { transaction },
      );
    });
  },
};
