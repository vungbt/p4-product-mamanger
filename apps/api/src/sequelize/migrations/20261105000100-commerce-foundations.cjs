'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'idempotency_records',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
          scope: { type: Sequelize.STRING, allowNull: false },
          actor_id: { type: Sequelize.UUID, allowNull: false },
          key: { type: Sequelize.STRING, allowNull: false },
          request_hash: { type: Sequelize.STRING, allowNull: false },
          result: { type: Sequelize.JSONB, allowNull: false },
          expires_at: { type: Sequelize.DATE, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );
      await queryInterface.createTable(
        'domain_events',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
          type: { type: Sequelize.STRING, allowNull: false },
          aggregate_type: { type: Sequelize.STRING, allowNull: false },
          aggregate_id: { type: Sequelize.STRING, allowNull: false },
          payload: { type: Sequelize.JSONB, allowNull: false },
          status: { type: Sequelize.STRING, allowNull: false },
          attempts: { type: Sequelize.INTEGER, allowNull: false },
          available_at: { type: Sequelize.DATE, allowNull: false },
          lease_until: { type: Sequelize.DATE, allowNull: true },
          delivered_at: { type: Sequelize.DATE, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );
      await queryInterface.createTable(
        'audit_logs',
        {
          id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
          actor_id: { type: Sequelize.UUID, allowNull: true },
          action: { type: Sequelize.STRING, allowNull: false },
          resource_type: { type: Sequelize.STRING, allowNull: false },
          resource_id: { type: Sequelize.STRING, allowNull: false },
          outcome: { type: Sequelize.STRING, allowNull: false },
          changes: { type: Sequelize.JSONB, allowNull: false },
          request_id: { type: Sequelize.STRING, allowNull: true },
          reason: { type: Sequelize.TEXT, allowNull: true },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );
      await queryInterface.addIndex('idempotency_records', ['scope', 'actor_id', 'key'], {
        unique: true,
        transaction,
      });
      await queryInterface.addIndex('domain_events', ['status', 'available_at'], { transaction });
      await queryInterface.addIndex('audit_logs', ['resource_type', 'resource_id', 'created_at'], {
        transaction,
      });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('audit_logs', { transaction });
      await queryInterface.dropTable('domain_events', { transaction });
      await queryInterface.dropTable('idempotency_records', { transaction });
    });
  },
};
