module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      for (const [name, spec] of Object.entries({
        lifecycle_status: {
          type: S.STRING,
          allowNull: false,
          defaultValue: 'pending_confirmation',
        },
        version: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
        currency: { type: S.STRING, allowNull: false, defaultValue: 'VND' },
        snapshot: { type: S.JSONB, allowNull: true },
        quote_id: {
          type: S.UUID,
          allowNull: true,
          unique: true,
          references: { model: 'checkout_quotes', key: 'id' },
        },
      }))
        await q.addColumn('orders', name, spec, { transaction });
      await q.sequelize.query(
        "UPDATE orders SET lifecycle_status = CASE status WHEN 'paid' THEN 'confirmed' WHEN 'shipping' THEN 'processing' WHEN 'completed' THEN 'completed' WHEN 'cancelled' THEN 'cancelled' ELSE 'pending_confirmation' END",
        { transaction },
      );
      for (const [name, spec] of Object.entries({
        sku: { type: S.STRING, allowNull: false, defaultValue: '' },
        size: { type: S.STRING, allowNull: false, defaultValue: '' },
        color: { type: S.STRING, allowNull: false, defaultValue: '' },
        image_url: { type: S.TEXT, allowNull: false, defaultValue: '' },
        discount_amount: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
        line_total: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
        cancelled_quantity: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
        fulfilled_quantity: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
        returned_quantity: { type: S.INTEGER, allowNull: false, defaultValue: 0 },
      }))
        await q.addColumn('order_items', name, spec, { transaction });
      await q.sequelize.query(
        "UPDATE order_items i SET sku = COALESCE(v.sku,''), size = COALESCE(v.size,''), color = COALESCE(v.color,''), line_total = i.unit_price * i.quantity FROM product_variants v WHERE v.id = i.variant_id",
        { transaction },
      );
      await q.sequelize.query(
        'ALTER TABLE order_items ADD CONSTRAINT order_item_quantities_valid CHECK (cancelled_quantity >= 0 AND fulfilled_quantity >= 0 AND returned_quantity >= 0 AND cancelled_quantity + fulfilled_quantity <= quantity AND returned_quantity <= fulfilled_quantity)',
        { transaction },
      );
      await q.createTable(
        'order_events',
        {
          id: { type: S.UUID, primaryKey: true },
          order_id: { type: S.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
          actor_id: { type: S.UUID, allowNull: true },
          type: { type: S.STRING, allowNull: false },
          detail: { type: S.JSONB, allowNull: false },
          public: { type: S.BOOLEAN, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.createTable(
        'cancellation_requests',
        {
          id: { type: S.UUID, primaryKey: true },
          order_id: { type: S.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
          user_id: { type: S.UUID, allowNull: false },
          status: { type: S.STRING, allowNull: false },
          reason: { type: S.TEXT, allowNull: false },
          resolution: { type: S.TEXT, allowNull: true },
          items: { type: S.JSONB, allowNull: false },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
    });
  },
  async down(q) {
    await q.dropTable('cancellation_requests');
    await q.dropTable('order_events');
    await q.sequelize.query('ALTER TABLE order_items DROP CONSTRAINT order_item_quantities_valid');
    for (const col of [
      'sku',
      'size',
      'color',
      'image_url',
      'discount_amount',
      'line_total',
      'cancelled_quantity',
      'fulfilled_quantity',
      'returned_quantity',
    ])
      await q.removeColumn('order_items', col);
    for (const col of ['lifecycle_status', 'version', 'currency', 'snapshot', 'quote_id'])
      await q.removeColumn('orders', col);
  },
};
