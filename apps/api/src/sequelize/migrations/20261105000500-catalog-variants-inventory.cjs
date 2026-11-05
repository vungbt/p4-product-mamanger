const { randomUUID } = require('node:crypto');
module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      const options = { transaction };
      await q.createTable(
        'size_guides',
        {
          id: { type: S.UUID, primaryKey: true },
          name: { type: S.STRING, allowNull: false },
          measurements: { type: S.JSONB, allowNull: false },
          version: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        options,
      );
      for (const [name, spec] of Object.entries({
        slug: { type: S.STRING, allowNull: true },
        status: { type: S.STRING(20), allowNull: false, defaultValue: 'active' },
        brand: { type: S.STRING, allowNull: false, defaultValue: '' },
        material: { type: S.STRING, allowNull: false, defaultValue: '' },
        care_instructions: { type: S.TEXT, allowNull: false, defaultValue: '' },
        seo_title: { type: S.STRING, allowNull: false, defaultValue: '' },
        seo_description: { type: S.STRING, allowNull: false, defaultValue: '' },
        size_guide_id: {
          type: S.UUID,
          allowNull: true,
          references: { model: 'size_guides', key: 'id' },
        },
        version: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
      }))
        await q.addColumn('products', name, spec, options);
      await q.sequelize.query("UPDATE products SET slug = 'product-' || id", options);
      await q.changeColumn('products', 'slug', { type: S.STRING, allowNull: false }, options);
      await q.addIndex('products', ['slug'], { unique: true, ...options });
      await q.createTable(
        'product_slug_redirects',
        {
          slug: { type: S.STRING, primaryKey: true },
          product_id: {
            type: S.STRING,
            allowNull: false,
            references: { model: 'products', key: 'id' },
          },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        options,
      );
      await q.createTable(
        'product_variants',
        {
          id: { type: S.UUID, primaryKey: true },
          product_id: {
            type: S.STRING,
            allowNull: false,
            references: { model: 'products', key: 'id' },
          },
          sku: { type: S.STRING, allowNull: false, unique: true },
          barcode: { type: S.STRING, allowNull: true, unique: true },
          size: { type: S.STRING(80), allowNull: false },
          color: { type: S.STRING(80), allowNull: false },
          price: { type: S.INTEGER, allowNull: false },
          status: { type: S.STRING(20), allowNull: false },
          is_default: { type: S.BOOLEAN, allowNull: false },
          image_ids: { type: S.ARRAY(S.UUID), allowNull: false, defaultValue: [] },
          on_hand: { type: S.INTEGER, allowNull: false },
          reserved: { type: S.INTEGER, allowNull: false },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        options,
      );
      await q.addIndex('product_variants', ['product_id', 'size', 'color'], {
        unique: true,
        ...options,
      });
      await q.sequelize.query(
        'CREATE UNIQUE INDEX product_one_default_variant ON product_variants(product_id) WHERE is_default = true',
        options,
      );
      await q.sequelize.query(
        'ALTER TABLE product_variants ADD CONSTRAINT variant_inventory_nonnegative CHECK (on_hand >= 0 AND reserved >= 0 AND reserved <= on_hand), ADD CONSTRAINT variant_price_nonnegative CHECK (price >= 0)',
        options,
      );
      await q.createTable(
        'inventory_movements',
        {
          id: { type: S.UUID, primaryKey: true },
          variant_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'product_variants', key: 'id' },
          },
          kind: { type: S.STRING(20), allowNull: false },
          quantity: { type: S.INTEGER, allowNull: false },
          on_hand_delta: { type: S.INTEGER, allowNull: false },
          reserved_delta: { type: S.INTEGER, allowNull: false },
          on_hand_after: { type: S.INTEGER, allowNull: false },
          reserved_after: { type: S.INTEGER, allowNull: false },
          actor_id: { type: S.UUID, allowNull: true },
          reason: { type: S.TEXT, allowNull: false },
          reference: { type: S.STRING, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        options,
      );
      for (const table of ['order_items', 'inventory_reservations'])
        await q.addColumn(
          table,
          'variant_id',
          { type: S.UUID, allowNull: true, references: { model: 'product_variants', key: 'id' } },
          options,
        );
      const [products] = await q.sequelize.query(
        "SELECT p.id, p.price, p.stock, COALESCE((SELECT SUM(r.quantity) FROM inventory_reservations r WHERE r.product_id = p.id AND r.status = 'reserved'), 0)::int AS reserved FROM products p",
        options,
      );
      const now = new Date();
      for (const product of products) {
        const id = randomUUID();
        const onHand = product.stock + product.reserved;
        await q.bulkInsert(
          'product_variants',
          [
            {
              id,
              product_id: product.id,
              sku: `LEGACY-${product.id}`,
              barcode: null,
              size: 'default',
              color: 'default',
              price: product.price,
              status: 'active',
              is_default: true,
              on_hand: onHand,
              reserved: product.reserved,
              version: 1,
              created_at: now,
              updated_at: now,
            },
          ],
          options,
        );
        await q.bulkInsert(
          'inventory_movements',
          [
            {
              id: randomUUID(),
              variant_id: id,
              kind: 'opening',
              quantity: onHand,
              on_hand_delta: onHand,
              reserved_delta: product.reserved,
              on_hand_after: onHand,
              reserved_after: product.reserved,
              actor_id: null,
              reason: 'Legacy balance backfill; stock is available, reservations remain reserved',
              reference: `opening:${id}`,
              created_at: now,
              updated_at: now,
            },
          ],
          options,
        );
        for (const table of ['order_items', 'inventory_reservations'])
          await q.sequelize.query(
            `UPDATE ${table} SET variant_id = :id WHERE product_id = :productId`,
            { replacements: { id, productId: product.id }, transaction },
          );
      }
    });
  },
  async down(q) {
    await q.sequelize.transaction(async (transaction) => {
      for (const table of ['order_items', 'inventory_reservations'])
        await q.removeColumn(table, 'variant_id', { transaction });
      for (const table of ['inventory_movements', 'product_variants', 'product_slug_redirects'])
        await q.dropTable(table, { transaction });
      for (const name of [
        'slug',
        'status',
        'brand',
        'material',
        'care_instructions',
        'seo_title',
        'seo_description',
        'size_guide_id',
        'version',
      ])
        await q.removeColumn('products', name, { transaction });
      await q.dropTable('size_guides', { transaction });
    });
  },
};
