import { createCookieOriginGuard } from '@p4/server-core';
import { env, LOCAL_WEB_ORIGINS } from '@/configs/env.js';

/** Web origins allowed to send cookie-authenticated writes (and Better Auth trusted origins). */
export function allowedWebOrigins(): string[] {
  return [
    ...(Array.isArray(env.corsOrigin) ? env.corsOrigin : []),
    ...(!env.isProd ? LOCAL_WEB_ORIGINS : []),
  ];
}

export const assertCookieOrigin = createCookieOriginGuard(() => [
  ...allowedWebOrigins(),
  new URL(env.auth.url).origin,
  ...(!env.isProd ? [`http://localhost:${env.port}`, `http://127.0.0.1:${env.port}`] : []),
]);
