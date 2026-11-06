import type { Request } from 'express';
import { env } from '@/configs/env.js';
import { AUDIT_ACTIONS } from '@/shared/audit/types.js';
import { requestStore } from '@/shared/request-store.js';
import { Forbidden } from '@/utils/errors/index.js';

export function assertCookieOrigin(req: Request) {
  if (!req.headers.cookie || req.headers.authorization?.startsWith('Bearer ')) return;
  const action = requestStore.getStore()?.audit?.action;
  const writes =
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
    (action && AUDIT_ACTIONS[action].changesData);
  if (!writes) return;
  const origin = req.header('origin');
  if (!origin && req.header('sec-fetch-site') === 'same-origin') return;
  const configured = process.env.BETTER_AUTH_URL ?? process.env.PUBLIC_API_URL;
  const origins = [
    ...(Array.isArray(env.corsOrigin) ? env.corsOrigin : []),
    ...(configured ? [new URL(configured).origin] : []),
    ...(!env.isProd
      ? [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3001',
          'http://localhost:3001',
        ]
      : []),
  ];
  if (!origin || !origins.includes(origin)) throw new Forbidden('invalid_origin');
}
