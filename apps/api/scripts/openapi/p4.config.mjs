/**
 * OpenAPI generator config of @p4/api (the default of generate.mjs). Another app passes its own
 * config with `--config <file>`; see apps/stay/api/scripts/openapi/config.mjs.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_DESCRIPTION, OPERATIONS, OVERRIDES, TAG_DESCRIPTIONS } from './metadata.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default {
  appRoot,
  title: 'P4 Commerce API',
  generateCommand: 'pnpm --filter @p4/api openapi:generate',
  /** Exported interfaces/types without generics become `#/components/schemas/<Name>`. */
  contractFiles: [
    'libs/shared/src/index.ts',
    'libs/processes/src/shared/index.ts',
    'libs/realtime/src/shared/index.ts',
  ],
  metadata: { API_DESCRIPTION, OPERATIONS, OVERRIDES, TAG_DESCRIPTIONS },
  sessionCookie: 'better-auth.session_token',
  authTagDescription:
    'Better Auth native endpoints. Browser clients use @p4/api-sdk/auth and HttpOnly session cookies.',
  /** Routes mounted directly in app.ts: [method, path, tag, operation]. */
  appRoutes: [
    [
      'post',
      '/api/payments/webhook/stripe',
      'payments',
      {
        description: '**Xác thực bằng chữ ký Stripe**, không dùng bearer token.',
        security: [],
        parameters: [
          { name: 'Stripe-Signature', in: 'header', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          200: { description: 'Đã nhận event (event trùng được bỏ qua).' },
          400: { $ref: '#/components/responses/ValidationError' },
        },
      },
    ],
    ...['/health', '/health/live', '/health/ready'].map((openPath) => [
      'get',
      openPath,
      'operations',
      {
        description: '**Công khai.**',
        security: [],
        responses: {
          200: {
            description: 'Service sẵn sàng',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { status: { type: 'string' } } },
              },
            },
          },
          ...(openPath === '/health/ready' ? { 503: { description: 'Chưa sẵn sàng' } } : {}),
        },
      },
    ]),
  ],
};
