'use strict';

const { descriptionToHtml } = require('../rich-text-html.cjs');

/**
 * Product descriptions become HTML so RichTextView renders them and the kit Editor
 * can load them. Lexical editor state and plain text are converted; existing HTML
 * and empty values are left alone. Originals are kept in product_description_backups
 * so `down` restores them exactly.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'product_description_backups',
        {
          product_id: { type: Sequelize.STRING, primaryKey: true },
          description: { type: Sequelize.TEXT, allowNull: false },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('now'),
          },
        },
        { transaction },
      );

      const [rows] = await queryInterface.sequelize.query(
        'SELECT id, description FROM products ORDER BY id FOR UPDATE',
        { transaction },
      );

      for (const row of rows) {
        const html = descriptionToHtml(row.description);
        if (html === row.description) continue;

        await queryInterface.sequelize.query(
          'INSERT INTO product_description_backups (product_id, description) VALUES (:id, :description) ON CONFLICT (product_id) DO NOTHING',
          { replacements: { id: row.id, description: row.description }, transaction },
        );
        await queryInterface.sequelize.query(
          'UPDATE products SET description = :html, version = version + 1, updated_at = now() WHERE id = :id',
          { replacements: { id: row.id, html }, transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE products p
           SET description = b.description, version = p.version + 1, updated_at = now()
           FROM product_description_backups b
          WHERE b.product_id = p.id`,
        { transaction },
      );
      await queryInterface.dropTable('product_description_backups', { transaction });
    });
  },
};
