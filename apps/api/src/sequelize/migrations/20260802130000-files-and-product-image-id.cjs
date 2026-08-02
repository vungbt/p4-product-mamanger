'use strict';

const { randomUUID } = require('node:crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      storage_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      provider: {
        type: Sequelize.ENUM('cloudinary', 'system'),
        allowNull: false,
        defaultValue: 'cloudinary',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addColumn('products', 'image_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'files', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, image_url FROM products WHERE image_url IS NOT NULL AND image_url <> ''`,
    );
    const now = new Date();

    for (const row of rows) {
      const fileId = randomUUID();
      await queryInterface.bulkInsert('files', [
        {
          id: fileId,
          url: row.image_url,
          storage_id: `system-${fileId}`,
          provider: 'system',
          metadata: null,
          created_at: now,
          updated_at: now,
        },
      ]);
      await queryInterface.sequelize.query(
        `UPDATE products SET image_id = :fileId WHERE id = :productId`,
        { replacements: { fileId, productId: row.id } },
      );
    }

    await queryInterface.removeColumn('products', 'image_url');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'image_url', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });

    const [rows] = await queryInterface.sequelize.query(
      `SELECT p.id AS product_id, f.url AS url
       FROM products p
       LEFT JOIN files f ON f.id = p.image_id`,
    );
    for (const row of rows) {
      await queryInterface.sequelize.query(`UPDATE products SET image_url = :url WHERE id = :id`, {
        replacements: { url: row.url || '', id: row.product_id },
      });
    }

    await queryInterface.removeColumn('products', 'image_id');
    await queryInterface.dropTable('files');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_files_provider";');
  },
};
