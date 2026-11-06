'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE users ADD COLUMN email_verified boolean NOT NULL DEFAULT false;
        UPDATE users SET email_verified = email_verified_at IS NOT NULL;
        UPDATE users SET display_name = split_part(email, '@', 1) WHERE display_name IS NULL;
        CREATE TABLE auth_accounts (
          id uuid PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          access_token text, refresh_token text, id_token text, password text, scope text,
          access_token_expires_at timestamptz, refresh_token_expires_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE(provider_id, account_id)
        );
        CREATE INDEX auth_accounts_user_idx ON auth_accounts(user_id);
        CREATE TABLE auth_sessions (
          id uuid PRIMARY KEY, token text NOT NULL UNIQUE,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at timestamptz NOT NULL, ip_address text, user_agent text,
          created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
        CREATE INDEX auth_sessions_expiry_idx ON auth_sessions(expires_at);
        CREATE TABLE auth_verifications (
          id uuid PRIMARY KEY, identifier text NOT NULL, value text NOT NULL,
          expires_at timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX auth_verifications_identifier_idx ON auth_verifications(identifier);
        INSERT INTO auth_accounts(id, account_id, provider_id, user_id, password)
          SELECT gen_random_uuid(), id::text, 'credential', id, password_hash FROM users WHERE password_hash IS NOT NULL;
        INSERT INTO auth_accounts(id, account_id, provider_id, user_id)
          SELECT gen_random_uuid(), google_id, 'google', id FROM users WHERE google_id IS NOT NULL;
        UPDATE refresh_tokens SET revoked_at=COALESCE(revoked_at, now());
        UPDATE users SET auth_version=auth_version+1;

        -- Compatibility for existing account/profile services and seeded users. Values stay identical;
        -- each direction writes only when distinct, so the triggers cannot recurse indefinitely.
        CREATE FUNCTION p4_auth_user_before() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP='INSERT' THEN
            NEW.email_verified := NEW.email_verified OR NEW.email_verified_at IS NOT NULL;
          ELSIF NEW.email_verified_at IS DISTINCT FROM OLD.email_verified_at THEN
            NEW.email_verified := NEW.email_verified_at IS NOT NULL;
          ELSIF NEW.email_verified IS DISTINCT FROM OLD.email_verified THEN
            NEW.email_verified_at := CASE WHEN NEW.email_verified THEN now() ELSE NULL END;
          END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER auth_user_before BEFORE INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION p4_auth_user_before();
        CREATE FUNCTION p4_auth_user_after() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.password_hash IS NOT NULL AND (TG_OP='INSERT' OR NEW.password_hash IS DISTINCT FROM OLD.password_hash) THEN
            INSERT INTO auth_accounts(id, account_id, provider_id, user_id, password)
              VALUES(gen_random_uuid(), NEW.id::text, 'credential', NEW.id, NEW.password_hash)
              ON CONFLICT(provider_id, account_id) DO UPDATE SET password=EXCLUDED.password, updated_at=now()
              WHERE auth_accounts.password IS DISTINCT FROM EXCLUDED.password;
          END IF;
          IF TG_OP='UPDATE' AND (NEW.auth_version IS DISTINCT FROM OLD.auth_version OR NEW.account_status <> 'active') THEN
            DELETE FROM auth_sessions WHERE user_id=NEW.id;
          END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER auth_user_after AFTER INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION p4_auth_user_after();
        CREATE FUNCTION p4_auth_account_after() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.provider_id='credential' AND NEW.password IS NOT NULL THEN
            UPDATE users SET password_hash=NEW.password WHERE id=NEW.user_id AND password_hash IS DISTINCT FROM NEW.password;
          END IF;
          IF NEW.provider_id='google' THEN
            UPDATE users SET google_id=NEW.account_id WHERE id=NEW.user_id AND google_id IS DISTINCT FROM NEW.account_id;
          END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER auth_account_after AFTER INSERT OR UPDATE ON auth_accounts FOR EACH ROW EXECUTE FUNCTION p4_auth_account_after();
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP TRIGGER auth_user_before ON users;
        DROP TRIGGER auth_user_after ON users;
        DROP TRIGGER auth_account_after ON auth_accounts;
        DROP FUNCTION p4_auth_user_before(); DROP FUNCTION p4_auth_user_after(); DROP FUNCTION p4_auth_account_after();
        DROP TABLE auth_verifications, auth_sessions, auth_accounts;
        ALTER TABLE users DROP COLUMN email_verified;
      `,
        { transaction },
      );
    });
  },
};
