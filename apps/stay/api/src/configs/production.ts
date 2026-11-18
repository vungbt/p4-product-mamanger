import {
  assertExplicitCors,
  assertHttpsAuthUrl,
  assertSecret,
  createBlockedPasswordCheck,
  PUBLIC_DEMO_PASSWORDS,
  PUBLIC_PLACEHOLDERS,
} from '@p4/server-core';
import { env } from './env.js';

/** Local seed password of `owner@stay.local` (apps/stay/api/README.md); never valid in production. */
export const STAY_SEED_PASSWORD = 'stay-owner-123';

/** Published demo passwords (P4's and Stay's seed) never authenticate in production. */
export const isBlockedPassword = createBlockedPasswordCheck(
  env.isProd,
  new Set([...PUBLIC_DEMO_PASSWORDS, STAY_SEED_PASSWORD]),
);

/** Placeholders published in `.env.example` and the development fallbacks of `env.ts`. */
const STAY_PLACEHOLDERS = [...PUBLIC_PLACEHOLDERS, /^stay-dev-secret/i];

export function assertProductionConfig() {
  if (!env.isProd) return;

  assertSecret(
    'STAY_BETTER_AUTH_SECRET',
    process.env.STAY_BETTER_AUTH_SECRET,
    32,
    STAY_PLACEHOLDERS,
  );
  assertSecret('STAY_DATABASE_PASSWORD', process.env.STAY_DATABASE_PASSWORD, 12, STAY_PLACEHOLDERS);

  assertHttpsAuthUrl(process.env.STAY_BETTER_AUTH_URL);
  assertExplicitCors(env.corsOrigin);
}
