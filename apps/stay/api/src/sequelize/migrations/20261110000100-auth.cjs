'use strict';
/**
 * Better Auth tables with the column layout `createBetterAuth` (@p4/server-core) maps to.
 * Stay users are separate from P4 users (own database).
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE users (
          id uuid PRIMARY KEY,
          email text NOT NULL,
          display_name text NOT NULL,
          email_verified boolean NOT NULL DEFAULT false,
          avatar_url text,
          role text NOT NULL DEFAULT 'tenant' CHECK (role IN ('owner', 'manager', 'tenant')),
          account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'blocked')),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE UNIQUE INDEX users_email_key ON users (lower(email));
        CREATE TABLE auth_accounts (
          id uuid PRIMARY KEY,
          account_id text NOT NULL,
          provider_id text NOT NULL,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          access_token text, refresh_token text, id_token text, password text, scope text,
          access_token_expires_at timestamptz, refresh_token_expires_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE (provider_id, account_id)
        );
        CREATE INDEX auth_accounts_user_idx ON auth_accounts (user_id);
        CREATE TABLE auth_sessions (
          id uuid PRIMARY KEY,
          token text NOT NULL UNIQUE,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at timestamptz NOT NULL,
          ip_address text, user_agent text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX auth_sessions_user_idx ON auth_sessions (user_id);
        CREATE INDEX auth_sessions_expiry_idx ON auth_sessions (expires_at);
        CREATE TABLE auth_verifications (
          id uuid PRIMARY KEY,
          identifier text NOT NULL,
          value text NOT NULL,
          expires_at timestamptz NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX auth_verifications_identifier_idx ON auth_verifications (identifier);

        -- A blocked account loses its sessions immediately.
        CREATE FUNCTION stay_user_blocked() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.account_status <> 'active' THEN
            DELETE FROM auth_sessions WHERE user_id = NEW.id;
          END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER users_blocked AFTER UPDATE OF account_status ON users
          FOR EACH ROW EXECUTE FUNCTION stay_user_blocked();
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP TABLE auth_verifications, auth_sessions, auth_accounts, users;
        DROP FUNCTION stay_user_blocked();
      `,
        { transaction },
      );
    });
  },
};
