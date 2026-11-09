import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiReference } from '@scalar/express-api-reference';
import type { Express } from 'express';
import YAML from 'yaml';
import { env } from './env.js';

function resolveOpenApiPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, '../../openapi.yaml'),
    path.resolve(process.cwd(), 'openapi.yaml'),
    path.resolve(process.cwd(), 'apps/stay/api/openapi.yaml'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) throw new Error('OpenAPI document not found.');
  return found;
}

/** The documented server: `STAY_PUBLIC_API_URL` origin, or the current origin. */
export function documentationServerUrl() {
  if (!env.publicApiUrl) return '/';

  const url = new URL(env.publicApiUrl);

  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
    throw new Error('STAY_PUBLIC_API_URL must be an HTTP(S) server origin.');
  return url.origin;
}

/** `GET /api/openapi.json`, `GET /api/openapi.yaml` and the Scalar reference at `/api/docs`. */
export function mountOpenApiDocs(app: Express): void {
  const openApiPath = resolveOpenApiPath();
  const servers = [{ url: documentationServerUrl(), description: 'Current API server' }];

  const document = async () => {
    const raw: unknown = YAML.parse(await readFile(openApiPath, 'utf8'));

    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !('openapi' in raw))
      throw new Error('Invalid OpenAPI document.');
    return { ...Object.fromEntries(Object.entries(raw)), servers };
  };

  app.get('/api/openapi.json', (_req, res, next) => {
    void document()
      .then((spec) => {
        res.setHeader('Cache-Control', 'no-store');
        res.json(spec);
      })
      .catch(next);
  });
  app.get('/api/openapi.yaml', (_req, res, next) => {
    void document()
      .then((spec) => {
        res.setHeader('Cache-Control', 'no-store');
        res.type('application/yaml').send(YAML.stringify(spec));
      })
      .catch(next);
  });
  app.use(
    '/api/docs',
    apiReference({
      url: '/api/openapi.json',
      theme: 'default',
      servers,
      defaultHttpClient: { targetKey: 'js', clientKey: 'fetch' },
    }),
  );
}
