module.exports = {
  async up(q, S) {
    await q.addColumn('refunds', 'attempt_number', {
      type: S.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },
  async down(q) {
    await q.removeColumn('refunds', 'attempt_number');
  },
};
