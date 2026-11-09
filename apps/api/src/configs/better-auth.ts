import { AUTH_AUDIT_ACTIONS, type AuthEmailRequest, createBetterAuth } from '@p4/server-core';
import pg from 'pg';
import { UserModel } from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit/audited-command.js';
import { seal } from '@/shared/commerce/encryption.js';
import { enqueueEvent } from '@/shared/commerce/persistence.js';
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

/** Mail goes through the outbox; the worker sends it after commit. */
async function queueAuthEmail({ userId, email, url, purpose }: AuthEmailRequest) {
  await auditedTransaction(async (transaction) => {
    await enqueueEvent(
      {
        type: 'auth.mail_requested',
        aggregateType: 'user',
        aggregateId: userId,
        payload: {
          encrypted: seal(JSON.stringify({ to: email, url, purpose })),
          expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
        },
      },
      transaction,
    );
  });
}

export const authAuditActions = AUTH_AUDIT_ACTIONS;

export const auth = createBetterAuth({
  appName: 'P4 Store',
  baseURL:
    process.env.BETTER_AUTH_URL ?? process.env.PUBLIC_API_URL ?? `http://127.0.0.1:${env.port}`,
  secret: process.env.BETTER_AUTH_SECRET ?? env.jwt.secret,
  pool: authPool,
  trustedOrigins: [
    ...(Array.isArray(env.corsOrigin) ? env.corsOrigin : []),
    ...(!env.isProd ? ['http://127.0.0.1:5173', 'http://localhost:5173'] : []),
  ],
  isProd: env.isProd,
  isBlockedPassword,
  sendAuthEmail: queueAuthEmail,
  loadUser: async (id) => {
    const user = await UserModel.findByPk(id);
    return user ? { id: user.id, email: user.email, role: user.role } : null;
  },
  audit: { auditedTransaction, recordAudit },
  socialSignInBlockedRoles: ['admin'],
  ...(env.google.clientId
    ? {
        google: {
          clientId: env.google.clientId,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        },
      }
    : {}),
});
