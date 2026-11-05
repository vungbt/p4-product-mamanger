module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      await q.createTable(
        'carts',
        {
          id: { type: S.UUID, primaryKey: true },
          user_id: {
            type: S.UUID,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
          },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.createTable(
        'cart_items',
        {
          id: { type: S.UUID, primaryKey: true },
          cart_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'carts', key: 'id' },
            onDelete: 'CASCADE',
          },
          variant_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'product_variants', key: 'id' },
          },
          quantity: { type: S.INTEGER, allowNull: false },
          added_price: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('cart_items', ['cart_id', 'variant_id'], { unique: true, transaction });
      await q.sequelize.query(
        'ALTER TABLE cart_items ADD CONSTRAINT cart_quantity_valid CHECK (quantity BETWEEN 1 AND 99)',
        { transaction },
      );
    });
  },
  async down(q) {
    await q.dropTable('cart_items');
    await q.dropTable('carts');
  },
};
