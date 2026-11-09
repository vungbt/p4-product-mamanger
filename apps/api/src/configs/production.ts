import {
  assertExplicitCors,
  assertHttpsAuthUrl,
  assertHttpsMailTransport,
  assertSecret,
  createBlockedPasswordCheck,
} from '@p4/server-core';
import { env } from './env.js';

/** In production, published demo passwords never authenticate and cannot be set. */
export const isBlockedPassword = createBlockedPasswordCheck(env.isProd);

export function assertProductionConfig() {
  if (!env.isProd) return;

  assertSecret('BETTER_AUTH_SECRET', process.env.BETTER_AUTH_SECRET ?? env.jwt.secret, 32);
  assertSecret('MAIL_ENCRYPTION_KEY', process.env.MAIL_ENCRYPTION_KEY, 32);
  assertSecret('DATABASE_PASSWORD', process.env.DATABASE_PASSWORD, 12);

  assertHttpsAuthUrl(process.env.BETTER_AUTH_URL ?? process.env.PUBLIC_API_URL);
  assertExplicitCors(env.corsOrigin);
  assertHttpsMailTransport(process.env.MAIL_API_URL);
}
