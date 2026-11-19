const { createHash } = require('node:crypto');

// Preserve file references and historical snapshots while making their role explicit.
async function renameJsonKey(q, table, column, from, to, transaction, condition = '') {
  await q.sequelize.query(
    `UPDATE "${table}" SET "${column}" = ("${column}" - '${from}') || jsonb_build_object('${to}', "${column}" -> '${from}')
     WHERE "${column}" ? '${from}' ${condition}`,
    { transaction },
  );
}

// Match the canonical JSON used by quoteFingerprint, including nested sorted keys.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}

async function renameSnapshotItems(q, table, from, to, transaction) {
  const [rows] = await q.sequelize.query(
    `UPDATE "${table}" SET snapshot = jsonb_set(snapshot, '{items}', (
       SELECT jsonb_agg(CASE WHEN item ? '${from}'
         THEN (item - '${from}') || jsonb_build_object('${to}', item -> '${from}')
         ELSE item END ORDER BY position)
       FROM jsonb_array_elements(snapshot -> 'items') WITH ORDINALITY AS items(item, position)
     )) WHERE snapshot -> 'items' @> '[{}]'::jsonb
       AND EXISTS (SELECT 1 FROM jsonb_array_elements(snapshot -> 'items') AS item WHERE item ? '${from}')
     RETURNING id, snapshot`,
    { transaction },
  );
  if (table === 'checkout_quotes') {
    for (const row of rows) {
      const fingerprint = createHash('sha256')
        .update(JSON.stringify(canonical(row.snapshot)))
        .digest('hex');
      await q.sequelize.query(
        'UPDATE checkout_quotes SET fingerprint = :fingerprint WHERE id = :id',
        {
          replacements: { id: row.id, fingerprint },
          transaction,
        },
      );
    }
  }
}

async function migrate(q, reverse) {
  await q.sequelize.transaction(async (transaction) => {
    const columns = [
      ['products', 'image_id', 'thumbnail_id'],
      ['order_items', 'image_url', 'thumbnail_url'],
      ['content_entries', 'cover_file_id', 'thumbnail_file_id'],
      ['reviews', 'media_ids', 'image_ids'],
    ];
    for (const [table, oldName, newName] of columns) {
      await q.renameColumn(table, reverse ? newName : oldName, reverse ? oldName : newName, {
        transaction,
      });
    }
    for (const table of ['orders', 'checkout_quotes']) {
      await renameSnapshotItems(
        q,
        table,
        reverse ? 'thumbnailUrl' : 'imageUrl',
        reverse ? 'imageUrl' : 'thumbnailUrl',
        transaction,
      );
    }
    for (const [table, column] of [
      ['content_entries', 'published_snapshot'],
      ['content_revisions', 'snapshot'],
    ]) {
      await renameJsonKey(
        q,
        table,
        column,
        reverse ? 'thumbnailFileId' : 'coverFileId',
        reverse ? 'coverFileId' : 'thumbnailFileId',
        transaction,
      );
    }
    await renameJsonKey(
      q,
      'merchandising_entries',
      'payload',
      reverse ? 'thumbnailFileId' : 'imageFileId',
      reverse ? 'imageFileId' : 'thumbnailFileId',
      transaction,
      "AND payload ->> 'kind' = 'banner'",
    );
  });
}

module.exports = {
  up: (q) => migrate(q, false),
  down: (q) => migrate(q, true),
};
