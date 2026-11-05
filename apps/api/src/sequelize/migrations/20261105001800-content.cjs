module.exports = {
  async up(q, S) {
    await q.sequelize.transaction(async (transaction) => {
      await q.createTable(
        'content_taxonomies',
        {
          id: { type: S.UUID, primaryKey: true },
          kind: { type: S.STRING, allowNull: false },
          name: { type: S.STRING, allowNull: false },
          slug: { type: S.STRING, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('content_taxonomies', ['kind', 'slug'], { unique: true, transaction });
      await q.createTable(
        'content_entries',
        {
          id: { type: S.UUID, primaryKey: true },
          kind: { type: S.STRING, allowNull: false },
          slug: { type: S.STRING, allowNull: false },
          title: { type: S.STRING, allowNull: false },
          excerpt: { type: S.TEXT, allowNull: false },
          body: { type: S.JSONB, allowNull: false },
          cover_file_id: {
            type: S.UUID,
            allowNull: true,
            references: { model: 'files', key: 'id' },
          },
          author_id: { type: S.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
          taxonomy_ids: { type: S.ARRAY(S.UUID), allowNull: false, defaultValue: [] },
          status: { type: S.STRING, allowNull: false },
          published_at: { type: S.DATE, allowNull: true },
          scheduled_at: { type: S.DATE, allowNull: true },
          seo_title: { type: S.STRING, allowNull: false },
          seo_description: { type: S.STRING, allowNull: false },
          version: { type: S.INTEGER, allowNull: false },
          published_snapshot: { type: S.JSONB, allowNull: true },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('content_entries', ['kind', 'slug'], { unique: true, transaction });
      await q.createTable(
        'content_revisions',
        {
          id: { type: S.UUID, primaryKey: true },
          entry_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'content_entries', key: 'id' },
          },
          version: { type: S.INTEGER, allowNull: false },
          snapshot: { type: S.JSONB, allowNull: false },
          actor_id: { type: S.UUID, allowNull: false },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('content_revisions', ['entry_id', 'version'], { unique: true, transaction });
      await q.createTable(
        'content_redirects',
        {
          id: { type: S.UUID, primaryKey: true },
          kind: { type: S.STRING, allowNull: false },
          slug: { type: S.STRING, allowNull: false },
          entry_id: {
            type: S.UUID,
            allowNull: false,
            references: { model: 'content_entries', key: 'id' },
          },
          created_at: { type: S.DATE, allowNull: false },
          updated_at: { type: S.DATE, allowNull: false },
        },
        { transaction },
      );
      await q.addIndex('content_redirects', ['kind', 'slug'], { unique: true, transaction });
    });
  },
  async down(q) {
    for (const table of [
      'content_redirects',
      'content_revisions',
      'content_entries',
      'content_taxonomies',
    ])
      await q.dropTable(table);
  },
};
