import { env } from './env.js';

/** Values published in `.env*.example` or used as development fallbacks. */
const PUBLIC_PLACEHOLDERS = [/^replace-with/i, /^change-me/i, /^p4-dev-secret/i];

function assertSecret(name: string, value: string | undefined, minLength: number) {
  if (!value || value.length < minLength || PUBLIC_PLACEHOLDERS.some((p) => p.test(value)))
    throw new Error(
      `Production ${name} must be a private value of at least ${minLength} characters.`,
    );
}

/** Passwords published in this public repository (seeders and docs). */
const PUBLIC_DEMO_PASSWORDS = new Set(['admin123', 'user123', 'password123']);

/** In production, published demo passwords never authenticate and cannot be set. */
export function isBlockedPassword(password: string): boolean {
  return env.isProd && PUBLIC_DEMO_PASSWORDS.has(password);
}

export function assertProductionConfig() {
  if (!env.isProd) return;

  assertSecret('BETTER_AUTH_SECRET', process.env.BETTER_AUTH_SECRET ?? env.jwt.secret, 32);
  assertSecret('MAIL_ENCRYPTION_KEY', process.env.MAIL_ENCRYPTION_KEY, 32);
  assertSecret('DATABASE_PASSWORD', process.env.DATABASE_PASSWORD, 12);

  const publicUrl = process.env.BETTER_AUTH_URL ?? process.env.PUBLIC_API_URL;
  if (!publicUrl || new URL(publicUrl).protocol !== 'https:')
    throw new Error('Production BETTER_AUTH_URL must be the public HTTPS origin.');
  if (env.corsOrigin === true)
    throw new Error('Production CORS requires explicit allowed origins.');
  if (process.env.MAIL_API_URL && !process.env.MAIL_API_URL.startsWith('https://'))
    throw new Error('Production mail transport requires HTTPS.');
}
