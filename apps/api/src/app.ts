import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import morgan from 'morgan';
import { env } from '@/configs/env.js';
import { i18nMiddleware } from '@/configs/i18n.js';
import { mountOpenApiDocs } from '@/configs/openapi-docs.js';
import { baseMiddleware } from '@/middlewares/base.middleware.js';
import { handleErrorApi, notFoundHandler } from '@/middlewares/error.middleware.js';
import apiRouter from '@/modules/index.js';
import * as paymentsController from '@/modules/payments/payments.controller.js';

export function createApp() {
  const app = express();

  mountOpenApiDocs(app);

  if (env.isProd) app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));

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

  return app;
}
