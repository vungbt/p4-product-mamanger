import { logger } from '@p4/server-core';
import { assertProductionConfig } from '@/configs/production.js';
import { sequelize } from '@/sequelize/models/index.js';
import { runWorkerLoop } from '@/worker-loop.js';

const controller = new AbortController();

process.on('SIGTERM', () => controller.abort());
process.on('SIGINT', () => controller.abort());

async function main() {
  assertProductionConfig();
  await sequelize.authenticate();

  try {
    await runWorkerLoop(controller.signal);
  } finally {
    await sequelize.close();
  }
}

main().catch(() => {
  logger.error('[stay-worker] Startup failed');
  process.exitCode = 1;
});
