'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('addresses', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      full_name: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: false },
      line1: { type: Sequelize.STRING, allowNull: false },
      city: { type: Sequelize.STRING, allowNull: false },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addColumn('orders', 'status', {
      type: Sequelize.ENUM('pending', 'paid', 'shipping', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    });
    await queryInterface.addColumn('orders', 'address_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'addresses', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('orders', 'shipping_full_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'shipping_phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'shipping_line1', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'shipping_city', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'shipping_fee', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('orders', 'subtotal', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // Đơn cũ đã trừ stock → coi như paid; copy total → subtotal
    await queryInterface.sequelize.query(`
      UPDATE orders
      SET status = 'paid', subtotal = total, shipping_fee = 0
    `);

    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      provider: {
        type: Sequelize.ENUM('mock'),
        allowNull: false,
        defaultValue: 'mock',
      },
      amount: { type: Sequelize.INTEGER, allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      external_id: { type: Sequelize.STRING, allowNull: true },
      paid_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('payments', ['order_id']);
    await queryInterface.addIndex('payments', ['external_id']);

    await queryInterface.createTable('shipments', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      carrier: { type: Sequelize.STRING, allowNull: true },
      tracking_code: { type: Sequelize.STRING, allowNull: true },
      shipped_at: { type: Sequelize.DATE, allowNull: true },
      delivered_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shipments');
    await queryInterface.dropTable('payments');
    await queryInterface.removeColumn('orders', 'subtotal');
    await queryInterface.removeColumn('orders', 'shipping_fee');
    await queryInterface.removeColumn('orders', 'shipping_city');
    await queryInterface.removeColumn('orders', 'shipping_line1');
    await queryInterface.removeColumn('orders', 'shipping_phone');
    await queryInterface.removeColumn('orders', 'shipping_full_name');
    await queryInterface.removeColumn('orders', 'address_id');
    await queryInterface.removeColumn('orders', 'status');
    await queryInterface.dropTable('addresses');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_provider";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_shipments_status";');
  },
};
