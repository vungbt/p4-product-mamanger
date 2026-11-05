module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      await q.sequelize.query(
        'ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_order_id_key',
        { transaction },
      );
      await q.addColumn(
        'shipments',
        'fulfillment_status',
        { type: S.STRING, allowNull: false, defaultValue: 'pending_pack' },
        { transaction },
      );
      await q.addColumn(
        'shipments',
        'version',
        { type: S.INTEGER, allowNull: false, defaultValue: 1 },
        { transaction },
      );
      await q.sequelize.query(
        "UPDATE shipments SET fulfillment_status = CASE status WHEN 'shipped' THEN 'in_transit' WHEN 'delivered' THEN 'delivered' WHEN 'cancelled' THEN 'cancelled' ELSE 'pending_pack' END",
        { transaction },
      );
      await q.createTable(
        'shipment_items',
        {
          id: { type: S.UUID, primaryKey: true },
          shipment_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'shipments', key: 'id' },
          },
          order_item_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'order_items', key: 'id' },
          },
          quantity: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('shipment_items', ['shipment_id', 'order_item_id'], {
        unique: true,
        transaction,
      });
      await q.createTable(
        'shipment_events',
        {
          id: { type: S.UUID, primaryKey: true },
          shipment_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'shipments', key: 'id' },
          },
          type: { type: S.STRING, allowNull: false },
          reference: { type: S.STRING, allowNull: false },
          detail: { type: S.JSONB, allowNull: false },
          occurred_at: { type: S.DATE, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('shipment_events', ['shipment_id', 'reference'], {
        unique: true,
        transaction,
      });
      // Legacy order has at most one shipment. Preserve its allocation for the new engine.
      await q.sequelize.query(
        "INSERT INTO shipment_items (id,shipment_id,order_item_id,quantity,created_at,updated_at) SELECT i.id,s.id,i.id,i.quantity,i.created_at,i.updated_at FROM order_items i JOIN shipments s ON s.order_id=i.order_id WHERE s.status <> 'cancelled'",
        { transaction },
      );
      await q.sequelize.query(
        "UPDATE order_items i SET fulfilled_quantity = i.quantity FROM shipments s WHERE s.order_id=i.order_id AND s.status IN ('shipped','delivered')",
        { transaction },
      );
    });
  },
  async down(q) {
    await q.dropTable('shipment_events');
    await q.dropTable('shipment_items');
    await q.removeColumn('shipments', 'fulfillment_status');
    await q.removeColumn('shipments', 'version');
  },
};
