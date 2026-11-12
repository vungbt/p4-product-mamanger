'use strict';
/** ST-22: extend ST-25; keep history for every writer, including portal/inbox. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE maintenance_requests ADD COLUMN history jsonb NOT NULL DEFAULT '[]';
        UPDATE maintenance_requests SET history = jsonb_build_array(
          jsonb_build_object('status', status, 'at', updated_at));
        CREATE FUNCTION stay_maintenance_history() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP = 'INSERT' THEN
            NEW.history = jsonb_build_array(jsonb_build_object('status', NEW.status, 'at', now()));
          ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
            NEW.history = OLD.history || jsonb_build_array(jsonb_build_object('status', NEW.status, 'at', now()));
          ELSE
            NEW.history = OLD.history;
          END IF;
          RETURN NEW;
        END;
        $$;
        CREATE TRIGGER maintenance_history BEFORE INSERT OR UPDATE ON maintenance_requests
          FOR EACH ROW EXECUTE FUNCTION stay_maintenance_history();
        CREATE INDEX maintenance_requests_room_open_idx ON maintenance_requests(room_id)
          WHERE status IN ('new', 'open', 'in_progress');
        CREATE UNIQUE INDEX maintenance_requests_expense_key ON maintenance_requests(cost_expense_id)
          WHERE cost_expense_id IS NOT NULL;
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP INDEX maintenance_requests_expense_key;
        DROP INDEX maintenance_requests_room_open_idx;
        DROP TRIGGER maintenance_history ON maintenance_requests;
        DROP FUNCTION stay_maintenance_history();
        ALTER TABLE maintenance_requests DROP COLUMN history;
      `,
        { transaction },
      );
    });
  },
};
