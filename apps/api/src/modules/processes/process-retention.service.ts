import { Op } from 'sequelize';
import { ProcessModel, sequelize } from '@/sequelize/models/index.js';
import { removeProcessFile } from './storage.service.js';

export async function sweepProcessFiles(now = new Date()) {
  const rows = await ProcessModel.findAll({
    where: {
      cleanedAt: null,
      expiresAt: { [Op.lte]: now },
      state: {
        [Op.in]: [
          'completed',
          'completed_with_errors',
          'failed',
          'cancelled',
          'awaiting_confirmation',
        ],
      },
    },
    order: [['expiresAt', 'ASC']],
    limit: 100,
  });
  for (const row of rows) {
    if (row.input.kind === 'data.import') await removeProcessFile(row.input.storageKey);
    if (row.outputKey) await removeProcessFile(row.outputKey);
    await row.update({ outputKey: null, cleanedAt: now });
  }
  await sequelize.query(
    "DELETE FROM rate_limit_buckets WHERE key IN (SELECT key FROM rate_limit_buckets WHERE reset_at < NOW() - INTERVAL '1 day' LIMIT 1000)",
  );
  return rows.length;
}
