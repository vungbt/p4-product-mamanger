'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('categories', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addColumn('products', 'category_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'categories', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.createTable('product_images', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      product_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'files', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('product_images', ['product_id', 'sort_order']);

    // Backfill cover image → product_images
    const [products] = await queryInterface.sequelize.query(
      `SELECT id, image_id FROM products WHERE image_id IS NOT NULL`,
    );
    const now = new Date();
    for (const p of products) {
      const id = require('node:crypto').randomUUID();
      await queryInterface.bulkInsert('product_images', [
        {
          id,
          product_id: p.id,
          file_id: p.image_id,
          sort_order: 0,
          created_at: now,
          updated_at: now,
        },
      ]);
    }

    await queryInterface.createTable('coupons', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      type: { type: Sequelize.ENUM('percent', 'fixed'), allowNull: false },
      value: { type: Sequelize.INTEGER, allowNull: false },
      min_order_amount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      max_discount: { type: Sequelize.INTEGER, allowNull: true },
      usage_limit: { type: Sequelize.INTEGER, allowNull: true },
      used_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      starts_at: { type: Sequelize.DATE, allowNull: true },
      ends_at: { type: Sequelize.DATE, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addColumn('orders', 'discount_amount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.createTable('order_coupons', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      coupon_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'coupons', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      code: { type: Sequelize.STRING, allowNull: false },
      discount_amount: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('inventory_reservations', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      status: {
        type: Sequelize.ENUM('reserved', 'committed', 'released'),
        allowNull: false,
        defaultValue: 'reserved',
      },
      expires_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('inventory_reservations', ['order_id']);
    await queryInterface.addIndex('inventory_reservations', ['product_id', 'status']);

    await queryInterface.createTable('refunds', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      payment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'payments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: { type: Sequelize.INTEGER, allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reason: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('reviews', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      product_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: false, defaultValue: '' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('reviews', ['product_id', 'user_id'], {
      unique: true,
      name: 'reviews_product_user_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reviews');
    await queryInterface.dropTable('refunds');
    await queryInterface.dropTable('inventory_reservations');
    await queryInterface.dropTable('order_coupons');
    await queryInterface.removeColumn('orders', 'discount_amount');
    await queryInterface.dropTable('coupons');
    await queryInterface.dropTable('product_images');
    await queryInterface.removeColumn('products', 'category_id');
    await queryInterface.dropTable('categories');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_coupons_type";');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_inventory_reservations_status";',
    );
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_refunds_status";');
  },
};
