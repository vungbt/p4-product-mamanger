'use strict';
/**
 * Notification channels: in-app notifications for tenants, email/browser push preferences and
 * Web Push subscriptions.
 *
 * - `notifications` gains `kind`, `audience` (`staff`: every staff member of the building;
 *   `tenant`: the occupants of `contract_id`, or only `tenant_id`). Existing rows are staff
 *   automation notices.
 * - `notification_tenant_reads`: read state of a tenant (staff keep `notification_reads`).
 * - `notification_preferences`: one row per staff user or tenant; no row = everything on.
 * - `push_subscriptions`: browser endpoints of a staff user or of a tenant portal link (a revoked
 *   link stops receiving pushes; deleting the link deletes them).
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE notifications
          ADD COLUMN kind text NOT NULL DEFAULT 'automation',
          ADD COLUMN audience text NOT NULL DEFAULT 'staff' CHECK (audience IN ('staff','tenant')),
          ADD COLUMN contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
          ADD COLUMN tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
          ADD CONSTRAINT notifications_tenant_audience_check
            CHECK (audience = 'staff' OR contract_id IS NOT NULL);
        CREATE INDEX notifications_contract_created ON notifications (contract_id, created_at DESC)
          WHERE audience = 'tenant';

        CREATE TABLE notification_tenant_reads (
          notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
          tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          read_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (notification_id, tenant_id)
        );

        CREATE TABLE notification_preferences (
          id uuid PRIMARY KEY,
          user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          tenant_id uuid UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
          email boolean NOT NULL DEFAULT true,
          push boolean NOT NULL DEFAULT true,
          muted_groups text[] NOT NULL DEFAULT '{}',
          updated_at timestamptz NOT NULL DEFAULT now(),
          CHECK ((user_id IS NULL) <> (tenant_id IS NULL))
        );

        CREATE TABLE push_subscriptions (
          id uuid PRIMARY KEY,
          user_id uuid REFERENCES users(id) ON DELETE CASCADE,
          portal_link_id uuid REFERENCES tenant_portal_links(id) ON DELETE CASCADE,
          endpoint text NOT NULL UNIQUE,
          p256dh text NOT NULL,
          auth text NOT NULL,
          user_agent text,
          failures integer NOT NULL DEFAULT 0,
          last_success_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          CHECK ((user_id IS NULL) <> (portal_link_id IS NULL))
        );
        CREATE INDEX push_subscriptions_user_idx ON push_subscriptions (user_id)
          WHERE user_id IS NOT NULL;
        CREATE INDEX push_subscriptions_link_idx ON push_subscriptions (portal_link_id)
          WHERE portal_link_id IS NOT NULL;
        CREATE INDEX domain_events_type_pending_idx ON domain_events (type, available_at)
          WHERE status IN ('pending','processing');
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS domain_events_type_pending_idx;
        DROP TABLE IF EXISTS push_subscriptions;
        DROP TABLE IF EXISTS notification_preferences;
        DROP TABLE IF EXISTS notification_tenant_reads;
        DELETE FROM notifications WHERE audience = 'tenant';
        DROP INDEX IF EXISTS notifications_contract_created;
        ALTER TABLE notifications
          DROP CONSTRAINT IF EXISTS notifications_tenant_audience_check,
          DROP COLUMN IF EXISTS tenant_id,
          DROP COLUMN IF EXISTS contract_id,
          DROP COLUMN IF EXISTS audience,
          DROP COLUMN IF EXISTS kind;
      `,
        { transaction },
      );
    });
  },
};
