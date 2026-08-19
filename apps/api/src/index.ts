import { createApp } from '@/app.js';
import { env } from '@/configs/env.js';
import { sequelize } from '@/sequelize/models/index.js';
import { logger } from '@/utils/logger.js';

async function main() {
  await sequelize.authenticate();
  logger.info('[DB] Connection established');

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`@p4/api listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
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
