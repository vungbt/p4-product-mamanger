module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      for (const [name, spec] of Object.entries({
        attempt_id: {
          type: S.UUID,
          allowNull: true,
          references: { model: 'payment_attempts', key: 'id' },
        },
        external_id: { type: S.STRING, allowNull: true, unique: true },
        manual_reference: { type: S.STRING, allowNull: true, unique: true },
        return_id: {
          type: S.UUID,
          allowNull: true,
          unique: true,
          references: { model: 'return_requests', key: 'id' },
        },
        processing_status: { type: S.STRING, allowNull: false, defaultValue: 'requested' },
        version: { type: S.INTEGER, allowNull: false, defaultValue: 1 },
      }))
        await q.addColumn('refunds', name, spec, { transaction });
      await q.sequelize.query(
        "UPDATE refunds SET processing_status=CASE status WHEN 'completed' THEN 'succeeded' WHEN 'failed' THEN 'failed' ELSE 'requested' END",
        { transaction },
      );
      await q.sequelize.query(
        "UPDATE refunds r SET attempt_id=a.id FROM payment_attempts a WHERE a.payment_id=r.payment_id AND a.status='paid'",
        { transaction },
      );
    });
  },
  async down(q) {
    for (const name of [
      'attempt_id',
      'external_id',
      'manual_reference',
      'return_id',
      'processing_status',
      'version',
    ])
      await q.removeColumn('refunds', name);
  },
};
