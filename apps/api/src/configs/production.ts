import { env } from './env.js';

export function assertProductionConfig() {
  if (!env.isProd) return;
  if (env.jwt.secret.length < 32 || env.jwt.secret === 'p4-dev-secret-change-me')
    throw new Error('A strong JWT_SECRET is required in production.');
  if (env.corsOrigin === true)
    throw new Error('Production CORS requires explicit allowed origins.');
  if (!process.env.MAIL_ENCRYPTION_KEY || process.env.MAIL_ENCRYPTION_KEY.length < 32)
    throw new Error('Production MAIL_ENCRYPTION_KEY must have at least 32 characters.');
  if (process.env.MAIL_API_URL && !process.env.MAIL_API_URL.startsWith('https://'))
    throw new Error('Production mail transport requires HTTPS.');
}
