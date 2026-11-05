module.exports = {
  async up(q, S) {
    await q.sequelize.query("ALTER TYPE enum_payments_provider ADD VALUE IF NOT EXISTS 'cod'");
    await q.sequelize.transaction(async (transaction) => {
      await q.createTable(
        'payment_attempts',
        {
          id: { type: S.UUID, primaryKey: true },
          payment_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'payments', key: 'id' },
          },
          order_id: { type: S.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
          provider: { type: S.STRING, allowNull: false },
          status: { type: S.STRING, allowNull: false },
          amount: { type: S.INTEGER, allowNull: false },
          currency: { type: S.STRING, allowNull: false },
          external_id: { type: S.STRING, allowNull: true, unique: true },
          provider_transaction_id: { type: S.STRING, allowNull: true },
          checkout_url: { type: S.TEXT, allowNull: true },
          reconciliation: { type: S.STRING, allowNull: false },
          paid_at: { type: S.DATE, allowNull: true },
          expires_at: { type: S.DATE, allowNull: false },
          version: { type: S.INTEGER, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.sequelize.query(
        "INSERT INTO payment_attempts SELECT p.id,p.id,p.order_id,p.provider,p.status,p.amount,o.currency,p.external_id,NULL,p.checkout_url,'unreconciled',p.paid_at,COALESCE((SELECT MAX(r.expires_at) FROM inventory_reservations r WHERE r.order_id=p.order_id),p.created_at+INTERVAL '30 minutes'),1,p.created_at,p.updated_at FROM payments p JOIN orders o ON o.id=p.order_id",
        { transaction },
      );
      await q.sequelize.query(
        "CREATE UNIQUE INDEX payment_one_active_attempt ON payment_attempts(order_id) WHERE status IN ('pending','processing')",
        { transaction },
      );
      await q.createTable(
        'payment_ledger',
        {
          id: { type: S.UUID, primaryKey: true },
          attempt_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'payment_attempts', key: 'id' },
          },
          order_id: { type: S.UUID, allowNull: false, references: { model: 'orders', key: 'id' } },
          kind: { type: S.STRING, allowNull: false },
          amount: { type: S.INTEGER, allowNull: false },
          currency: { type: S.STRING, allowNull: false },
          provider: { type: S.STRING, allowNull: false },
          reference: { type: S.STRING, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('payment_ledger', ['provider', 'reference', 'kind'], {
        unique: true,
        transaction,
      });
      await q.createTable(
        'webhook_receipts',
        {
          id: { type: S.STRING, primaryKey: true },
          provider: { type: S.STRING, allowNull: false },
          event_type: { type: S.STRING, allowNull: false },
          payload_hash: { type: S.STRING, allowNull: false },
          status: { type: S.STRING, allowNull: false },
          error_code: { type: S.STRING, allowNull: true },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
    });
  },
  async down(q) {
    await q.dropTable('webhook_receipts');
    await q.dropTable('payment_ledger');
    await q.dropTable('payment_attempts');
  },
};
