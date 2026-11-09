import { baseMiddleware, handleErrorApi, notFoundHandler, requestContext } from '@p4/server-core';
import { toNodeHandler } from 'better-auth/node';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { auth } from '@/configs/better-auth.js';
import { env } from '@/configs/env.js';
import { i18nMiddleware } from '@/configs/i18n.js';
import { mountOpenApiDocs } from '@/configs/openapi-docs.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import apiRouter from '@/modules/index.js';
import { sequelize } from '@/sequelize/models/index.js';

export function createApp() {
  const app = express();

  app.use(requestContext);
  app.use(i18nMiddleware);

  mountOpenApiDocs(app);

  if (env.isProd) app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));

  // Better Auth reads the raw body: mount it before express.json().
  app.use('/api/auth/sign-in', rateLimit('stay-sign-in', 30));
  app.all('/api/auth/*', toNodeHandler(auth));

  app.use(express.json({ limit: '1mb' }));

  app.get('/health/live', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/health', (_req, res) => {
    sequelize
      .authenticate()
      .then(() => res.json({ status: 'ok', service: '@stay/api', database: 'up' }))
      .catch(() =>
        res.status(503).json({ status: 'unavailable', service: '@stay/api', database: 'down' }),
      );
  });

  app.use('/api', baseMiddleware, apiRouter);
  app.use(notFoundHandler);
  app.use(handleErrorApi);

  return app;
}
