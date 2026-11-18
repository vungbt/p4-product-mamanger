import { createServer } from 'node:http';
import { logger } from '@p4/server-core';
import { createApp } from '@/app.js';
import { authPool } from '@/configs/better-auth.js';
import { env } from '@/configs/env.js';
import { assertProductionConfig } from '@/configs/production.js';
import { closeNotificationListener } from '@/modules/notifications/notifications.stream.js';
import { sequelize } from '@/sequelize/models/index.js';
import { runWorkerLoop } from '@/worker-loop.js';

async function main() {
  assertProductionConfig();
  await sequelize.authenticate();
  logger.info('[DB] Connection established');

  const server = createServer(createApp());

  server.listen(env.port, () => {
    logger.info(`@stay/api listening on http://localhost:${env.port}`);
  });

  // Small servers: run the automation/outbox worker in this process instead of `worker.js`.
  const worker = new AbortController();
  const workerDone = env.inlineWorker ? runWorkerLoop(worker.signal) : Promise.resolve();

  if (env.inlineWorker) logger.info('[stay-worker] Running inside the API process');

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    // Open SSE streams would keep `server.close()` waiting.
    void closeNotificationListener();
    worker.abort();
    server.close(async () => {
      try {
        await workerDone;
        await authPool.end();
        await sequelize.close();
        logger.info('[DB] Connection closed');
        process.exit(0);
      } catch (error) {
        logger.error('[DB] Close failed', error);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error('[App] Failed to start:', error);
  process.exit(1);
});
