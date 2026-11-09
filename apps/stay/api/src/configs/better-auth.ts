import {
  AUTH_AUDIT_ACTIONS,
  type AuthEmailRequest,
  BaseError,
  createBetterAuth,
  logger,
} from '@p4/server-core';
import pg from 'pg';
import { allowedWebOrigins } from '@/middlewares/cookie-origin.js';
import { loadActiveUser } from '@/modules/me/me.service.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { env } from './env.js';
import { isBlockedPassword } from './production.js';

export const authPool = new pg.Pool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.username,
  password: env.database.password,
  database: env.database.name,
  max: 5,
  allowExitOnIdle: true,
});

/**
 * Stay has no mail transport yet: outside production the link is logged for local testing;
 * production refuses until delivery goes through the outbox and a worker.
 */
async function sendAuthEmail({ userId, url, purpose }: AuthEmailRequest) {
  if (env.isProd) throw new BaseError('mail_unavailable', 503, 'mail_unavailable');
  logger.info(JSON.stringify({ event: 'auth.mail_requested', userId, purpose, url }));
}

export const authAuditActions = AUTH_AUDIT_ACTIONS;

export const auth = createBetterAuth({
  appName: 'Stay',
  baseURL: env.auth.url,
  secret: env.auth.secret,
  pool: authPool,
  trustedOrigins: allowedWebOrigins(),
  isProd: env.isProd,
  // Cookies are per host, not per port: `stay.*` never collides with P4's `better-auth.*`.
  cookiePrefix: 'stay',
  isBlockedPassword,
  sendAuthEmail,
  loadUser: async (id) => (await loadActiveUser(id)) ?? null,
  audit: { auditedTransaction, recordAudit },
  // Accounts are created by the owner (seed now, invitations later), never by public sign-up.
  disableSignUp: true,
  defaultRole: 'tenant',
  socialSignInBlockedRoles: ['owner', 'manager'],
  ...(env.google.clientId
    ? {
        google: {
          clientId: env.google.clientId,
          clientSecret: env.google.clientSecret,
          disableImplicitSignUp: true,
        },
      }
    : {}),
});
