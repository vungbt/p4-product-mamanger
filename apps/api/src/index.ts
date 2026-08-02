import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import morgan from 'morgan';
import { env } from '@/configs/env.js';
import { i18nMiddleware } from '@/configs/i18n.js';
import { mountOpenApiDocs } from '@/configs/openapi-docs.js';
import * as paymentsController from '@/controllers/payments.controller.js';
import { baseMiddleware } from '@/middlewares/base.middleware.js';
import { handleErrorApi, notFoundHandler } from '@/middlewares/error.middleware.js';
import apiRouter from '@/routers/index.js';
import { sequelize } from '@/sequelize/models/index.js';
import { logger } from '@/utils/logger.js';

async function main() {
  await sequelize.authenticate();
  logger.info('[DB] Connection established');

  const app = express();

  // Docs trước helmet — tránh CSP chặn Scalar UI
  mountOpenApiDocs(app);

  if (env.isProd) {
    app.use(helmet());
  }
  app.use(compression());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );

  // Stripe webhook needs raw body for signature verification
  app.post(
    '/api/payments/webhook/stripe',
    express.raw({ type: 'application/json' }),
    baseMiddleware,
    (req, res, next) => {
      void paymentsController.stripeWebhook(req, res, next);
    },
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(i18nMiddleware);

  app.get('/health', (_req, res) => {
    res.status(StatusCodes.OK).json({ status: 'ok', service: '@p4/api' });
  });

  app.use('/api', baseMiddleware, apiRouter);
  app.use(notFoundHandler);
  app.use(handleErrorApi);

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
      } catch (err) {
        logger.error('[DB] Close failed', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('[App] Failed to start:', err);
  process.exit(1);
});
