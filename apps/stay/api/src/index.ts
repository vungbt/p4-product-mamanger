import { createServer } from 'node:http';
import { logger } from '@p4/server-core';
import { createApp } from '@/app.js';
import { authPool } from '@/configs/better-auth.js';
import { env } from '@/configs/env.js';
import { assertProductionConfig } from '@/configs/production.js';
import { closeNotificationListener } from '@/modules/notifications/notifications.stream.js';
import { sequelize } from '@/sequelize/models/index.js';

async function main() {
  assertProductionConfig();
  await sequelize.authenticate();
  logger.info('[DB] Connection established');

  const server = createServer(createApp());

  server.listen(env.port, () => {
    logger.info(`@stay/api listening on http://localhost:${env.port}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    // Open SSE streams would keep `server.close()` waiting.
    void closeNotificationListener();
    server.close(async () => {
      try {
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
