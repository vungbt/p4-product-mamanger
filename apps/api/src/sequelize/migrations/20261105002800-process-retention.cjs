module.exports = {
  async up(q, S) {
    await q.addColumn('processes', 'cleaned_at', { type: S.DATE, allowNull: true });
  },
  async down(q) {
    await q.removeColumn('processes', 'cleaned_at');
  },
};
