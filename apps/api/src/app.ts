import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import { env } from '@/configs/env.js';
import { i18nMiddleware } from '@/configs/i18n.js';
import { mountOpenApiDocs } from '@/configs/openapi-docs.js';
import { baseMiddleware } from '@/middlewares/base.middleware.js';
import { handleErrorApi, notFoundHandler } from '@/middlewares/error.middleware.js';
import { requestContext } from '@/middlewares/request-context.middleware.js';
import apiRouter from '@/modules/index.js';
import * as paymentsController from '@/modules/payments/payments.controller.js';

export function createApp() {
  const app = express();

  app.use(requestContext);
  app.use(i18nMiddleware);

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
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      console.info(
        JSON.stringify({
          event: 'http.request',
          requestId: req.requestId,
          method: req.method,
          status: res.statusCode,
          durationMs: Date.now() - started,
        }),
      );
    });
    next();
  });

  app.get('/health/live', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/health/ready', (_req, res) => {
    void import('@/sequelize/index.js')
      .then(async ({ sequelize }) => {
        await sequelize.authenticate();
        res.json({ status: 'ready' });
      })
      .catch(() => res.status(503).json({ status: 'unavailable' }));
  });

  app.get('/health', (_req, res) => {
    res.status(StatusCodes.OK).json({ status: 'ok', service: '@p4/api' });
  });

  app.use('/api', baseMiddleware, apiRouter);
  app.use(notFoundHandler);
  app.use(handleErrorApi);

  return app;
}
