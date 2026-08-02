import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiReference } from '@scalar/express-api-reference';
import type { Express } from 'express';

function resolveOpenApiPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, '../openapi.yaml'), // src/ → apps/api/
    path.resolve(here, '../../openapi.yaml'), // dist/ → apps/api/
    path.resolve(process.cwd(), 'openapi.yaml'),
    path.resolve(process.cwd(), 'apps/api/openapi.yaml'),
  ];
  const found = candidates.find((p) => existsSync(p));
  if (!found) {
    throw new Error('openapi.yaml not found (expected next to apps/api package root)');
  }
  return found;
}

/** Serve OpenAPI spec + Scalar UI at /api/openapi.yaml and /api/docs */
export function mountOpenApiDocs(app: Express): void {
  const openApiPath = resolveOpenApiPath();

  app.get('/api/openapi.yaml', (_req, res) => {
    res.type('application/yaml');
    res.sendFile(openApiPath);
  });

  app.use(
    '/api/docs',
    apiReference({
      url: '/api/openapi.yaml',
      theme: 'default',
    }),
  );
}
