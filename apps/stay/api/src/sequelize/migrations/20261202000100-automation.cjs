'use strict';
module.exports = {
  async up(q) {
    await q.sequelize.transaction(async (transaction) => {
      await q.sequelize.query(
        `
        CREATE TABLE building_automations (
          building_id uuid PRIMARY KEY REFERENCES buildings(id) ON DELETE CASCADE,
          reading_reminder boolean NOT NULL DEFAULT false,
          create_drafts boolean NOT NULL DEFAULT false,
          before_due boolean NOT NULL DEFAULT false,
          after_due boolean NOT NULL DEFAULT false,
          tenant_reminders_disabled boolean NOT NULL DEFAULT true,
          version integer NOT NULL DEFAULT 1
        );
        CREATE TABLE automation_runs (
          id uuid PRIMARY KEY, building_id uuid NOT NULL REFERENCES buildings(id),
          period char(7) NOT NULL, kind text NOT NULL CHECK(kind IN ('reading','drafts','before_due','after_due')),
          status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','done')),
          scheduled_on date NOT NULL, completed_at timestamptz,
          UNIQUE(building_id,period,kind)
        );
        CREATE INDEX automation_runs_pending ON automation_runs(scheduled_on) WHERE status='pending';
        CREATE TABLE job_leases (
          key text PRIMARY KEY, token uuid NOT NULL, expires_at timestamptz NOT NULL
        );
        CREATE TABLE notifications (
          id uuid PRIMARY KEY, building_id uuid NOT NULL REFERENCES buildings(id),
          title text NOT NULL, body text NOT NULL, path text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX notifications_building_created ON notifications(building_id,created_at DESC);
        CREATE TABLE notification_reads (
          notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          read_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(notification_id,user_id)
        );
      `,
        { transaction },
      );
    });
  },
  async down(q) {
    await q.sequelize.query(
      'DROP TABLE notification_reads, notifications, job_leases, automation_runs, building_automations',
    );
  },
};
