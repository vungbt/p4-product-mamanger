'use strict';
/**
 * Billing calendar (rules.md "Lịch thu"): reading day in the consumption month or the next one,
 * a grace period before overdue, and the owner reminder before the reading day (ST-26).
 * System defaults live in `system_settings` (key `billing`, JSON); buildings override with
 * nullable columns (`null` = follow the system).
 */
module.exports = {
  async up(q) {
    await q.sequelize.transaction(async (transaction) => {
      await q.sequelize.query(
        `
        ALTER TABLE buildings
          ADD COLUMN reading_day_month varchar(4) CHECK (reading_day_month IN ('same', 'next')),
          ADD COLUMN grace_days smallint CHECK (grace_days BETWEEN 0 AND 31);

        UPDATE system_settings
          SET value = jsonb_build_object('readingDayMonth', 'same', 'graceDays', 0) || value
          WHERE key = 'billing';

        ALTER TABLE building_automations
          ADD COLUMN reading_reminder_before boolean NOT NULL DEFAULT false,
          ADD COLUMN reading_reminder_days_before smallint NOT NULL DEFAULT 1
            CHECK (reading_reminder_days_before BETWEEN 0 AND 10);

        ALTER TABLE automation_runs DROP CONSTRAINT automation_runs_kind_check;
        ALTER TABLE automation_runs ADD CONSTRAINT automation_runs_kind_check
          CHECK (kind IN ('reading_before', 'reading', 'drafts', 'before_due', 'after_due'));

        -- Next-month reading days date readings after the consumption month; the service checks
        -- the exact window, the database keeps a coarse bound (the period month and the next).
        ALTER TABLE meter_readings DROP CONSTRAINT meter_readings_check;
        ALTER TABLE meter_readings ADD CONSTRAINT meter_readings_read_on_window
          CHECK (read_on >= to_date(period || '-01', 'YYYY-MM-DD')
            AND read_on < to_date(period || '-01', 'YYYY-MM-DD') + interval '2 months');
      `,
        { transaction },
      );
    });
  },
  async down(q) {
    await q.sequelize.transaction(async (transaction) => {
      await q.sequelize.query(
        `
        ALTER TABLE meter_readings DROP CONSTRAINT meter_readings_read_on_window;
        ALTER TABLE meter_readings ADD CONSTRAINT meter_readings_check
          CHECK (to_char(read_on, 'YYYY-MM') = period);
        DELETE FROM automation_runs WHERE kind = 'reading_before';
        ALTER TABLE automation_runs DROP CONSTRAINT automation_runs_kind_check;
        ALTER TABLE automation_runs ADD CONSTRAINT automation_runs_kind_check
          CHECK (kind IN ('reading', 'drafts', 'before_due', 'after_due'));
        ALTER TABLE building_automations
          DROP COLUMN reading_reminder_days_before, DROP COLUMN reading_reminder_before;
        UPDATE system_settings SET value = value - 'readingDayMonth' - 'graceDays'
          WHERE key = 'billing';
        ALTER TABLE buildings DROP COLUMN grace_days, DROP COLUMN reading_day_month;
      `,
        { transaction },
      );
    });
  },
};
