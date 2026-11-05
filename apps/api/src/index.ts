import { createServer } from 'node:http';
import { createApp } from '@/app.js';
import { env } from '@/configs/env.js';
import { assertProductionConfig } from '@/configs/production.js';
import { attachRealtime } from '@/modules/realtime/realtime.service.js';
import { sequelize } from '@/sequelize/models/index.js';
import { logger } from '@/utils/logger.js';

async function main() {
  assertProductionConfig();
  await sequelize.authenticate();
  logger.info('[DB] Connection established');

  const app = createApp();
  const server = createServer(app);
  const realtime = await attachRealtime(server);
  server.listen(env.port, () => {
    logger.info(`@p4/api listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    await realtime.close();
    server.close(async () => {
      try {
        await sequelize.close();
        logger.info('[DB] Connection closed');
        process.exit(0);
      } catch (error) {
        logger.error('[DB] Close failed', error);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error('[App] Failed to start:', error);
  process.exit(1);
});
