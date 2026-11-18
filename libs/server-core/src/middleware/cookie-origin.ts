import type { Request } from 'express';
import { AUDIT_ACTIONS } from '../audit/types.js';
import { requestStore } from '../request-store.js';
import { Forbidden } from '../shared/errors.js';

/**
 * CSRF guard for cookie sessions: a cookie-authenticated write must come from an allowed
 * `Origin` (or be same-origin without one). Bearer requests are not affected. `allowedOrigins` is
 * read on every request so runtime configuration changes apply.
 */
export function createCookieOriginGuard(allowedOrigins: () => readonly string[]) {
  return function assertCookieOrigin(req: Request) {
    if (!req.headers.cookie || req.headers.authorization?.startsWith('Bearer ')) return;
    const action = requestStore.getStore()?.audit?.action;
    const writes =
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
      (action && AUDIT_ACTIONS[action].changesData);
    if (!writes) return;
    const origin = req.header('origin');
    if (!origin && req.header('sec-fetch-site') === 'same-origin') return;
    if (!origin || !allowedOrigins().includes(origin)) throw new Forbidden('invalid_origin');
  };
}
