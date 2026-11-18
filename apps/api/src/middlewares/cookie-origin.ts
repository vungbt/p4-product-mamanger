import { createCookieOriginGuard } from '@p4/server-core';
import { env } from '@/configs/env.js';

export const assertCookieOrigin = createCookieOriginGuard(() => {
  const configured = process.env.BETTER_AUTH_URL ?? process.env.PUBLIC_API_URL;
  return [
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
});
