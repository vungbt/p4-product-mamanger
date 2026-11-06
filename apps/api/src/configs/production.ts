import { env } from './env.js';

export function assertProductionConfig() {
  if (!env.isProd) return;
  const secret = process.env.BETTER_AUTH_SECRET ?? env.jwt.secret;
  if (secret.length < 32 || secret === 'p4-dev-secret-change-me')
    throw new Error('A strong BETTER_AUTH_SECRET is required in production.');
  const publicUrl = process.env.BETTER_AUTH_URL ?? process.env.PUBLIC_API_URL;
  if (!publicUrl || new URL(publicUrl).protocol !== 'https:')
    throw new Error('Production BETTER_AUTH_URL must be the public HTTPS origin.');
  if (env.corsOrigin === true)
    throw new Error('Production CORS requires explicit allowed origins.');
  if (!process.env.MAIL_ENCRYPTION_KEY || process.env.MAIL_ENCRYPTION_KEY.length < 32)
    throw new Error('Production MAIL_ENCRYPTION_KEY must have at least 32 characters.');
  if (process.env.MAIL_API_URL && !process.env.MAIL_API_URL.startsWith('https://'))
    throw new Error('Production mail transport requires HTTPS.');
}
