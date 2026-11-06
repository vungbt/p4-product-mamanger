import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { APIError, betterAuth } from 'better-auth';
import { createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';
import { bearer, openAPI } from 'better-auth/plugins';
import pg from 'pg';
import { UserModel } from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { recordAudit } from '@/shared/audit/record.js';
import type { AuditAction } from '@/shared/audit/types.js';
import { seal } from '@/shared/commerce/encryption.js';
import { enqueueEvent } from '@/shared/commerce/persistence.js';
import { requestStore } from '@/shared/request-store.js';
import { env } from './env.js';

export const authPool = new pg.Pool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.username,
  password: env.database.password,
  database: env.database.name,
  max: 5,
  allowExitOnIdle: true,
});

async function queueAuthEmail(userId: string, email: string, url: string, purpose: string) {
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

export const authAuditActions: Record<string, AuditAction> = {
  '/sign-in/email': 'login',
  '/sign-in/social': 'login',
  '/sign-out': 'logout',
  '/sign-up/email': 'create',
  '/change-password': 'change_password',
  '/reset-password': 'reset_password',
  '/change-email': 'change_email',
  '/verify-email': 'verify',
  '/revoke-session': 'revoke_session',
  '/revoke-sessions': 'revoke_session',
  '/revoke-other-sessions': 'revoke_session',
  '/request-password-reset': 'request_password_reset',
  '/send-verification-email': 'request_verification',
  '/update-user': 'update',
  '/update-session': 'update',
  '/delete-user': 'delete',
  '/link-social': 'update',
  '/unlink-account': 'delete',
  '/refresh-token': 'refresh_session',
  '/get-access-token': 'read',
  '/verify-password': 'read',
};

export const auth = betterAuth({
  appName: 'P4 Store',
  baseURL:
    process.env.BETTER_AUTH_URL ?? process.env.PUBLIC_API_URL ?? `http://127.0.0.1:${env.port}`,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET ?? env.jwt.secret,
  database: authPool,
  trustedOrigins: [
    ...(Array.isArray(env.corsOrigin) ? env.corsOrigin : []),
    ...(!env.isProd ? ['http://127.0.0.1:5173', 'http://localhost:5173'] : []),
  ],
  advanced: {
    database: { generateId: () => randomUUID() },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: env.isProd,
      sameSite: env.isProd ? 'none' : 'lax',
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      hash: (password) => bcrypt.hash(password, 12),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: ({ user, url }) =>
      queueAuthEmail(user.id, user.email, url, 'password_reset'),
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: ({ user, url }) =>
      queueAuthEmail(user.id, user.email, url, 'verify_email'),
  },
  user: {
    modelName: 'users',
    fields: {
      name: 'display_name',
      emailVerified: 'email_verified',
      image: 'avatar_url',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    additionalFields: {
      role: { type: 'string', defaultValue: 'user', input: false },
      accountStatus: {
        type: 'string',
        fieldName: 'account_status',
        defaultValue: 'active',
        input: false,
        returned: false,
      },
    },
    changeEmail: { enabled: true },
  },
  account: {
    modelName: 'auth_accounts',
    fields: {
      accountId: 'account_id',
      providerId: 'provider_id',
      userId: 'user_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    accountLinking: { enabled: true, trustedProviders: ['google'] },
  },
  session: {
    modelName: 'auth_sessions',
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    cookieCache: { enabled: false },
  },
  verification: {
    modelName: 'auth_verifications',
    fields: { expiresAt: 'expires_at', createdAt: 'created_at', updatedAt: 'updated_at' },
  },
  socialProviders: {
    ...(env.google.clientId
      ? {
          google: {
            clientId: env.google.clientId,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
          },
        }
      : {}),
  },
  hooks: {
    before: createAuthMiddleware(async (context) => {
      const action =
        authAuditActions[context.path] ??
        (context.path.startsWith('/callback/') ? 'login' : undefined);
      if (!action) return;
      const store = requestStore.getStore();
      if (store) {
        store.authAction = action;
        store.route = `/api/auth${context.path.startsWith('/callback/') ? '/callback/:provider' : context.path}`;
      }
      const session = await getSessionFromCtx(context, { disableRefresh: true }).catch(() => null);
      if (store && session) {
        const user = await UserModel.findByPk(session.user.id);
        if (user) store.user = { id: user.id, email: user.email, role: user.role };
      }
    }),
    after: createAuthMiddleware(async (context) => {
      const action =
        authAuditActions[context.path] ??
        (context.path.startsWith('/callback/') ? 'login' : undefined);
      if (!action) return;
      const returned = context.context.returned;
      const failed = returned instanceof APIError;
      const user =
        context.context.newSession?.user ??
        context.context.session?.user ??
        requestStore.getStore()?.user;
      const store = requestStore.getStore();
      const existing = user ? await UserModel.findByPk(user.id) : null;
      if (store && existing)
        store.user = { id: existing.id, email: existing.email, role: existing.role };
      try {
        await auditedTransaction((transaction) =>
          recordAudit(
            {
              actorId: user?.id ?? null,
              action: `auth.${action}`,
              source: 'auth',
              resourceType: 'user',
              resourceId: user?.id ?? store?.requestId ?? randomUUID(),
              outcome: failed ? 'failure' : 'success',
              changes: { action, source: 'auth' },
            },
            transaction,
          ),
        );
      } catch {
        console.error(
          JSON.stringify({ event: 'auth.audit_failed', requestId: store?.requestId, action }),
        );
      }
    }),
  },
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          const store = requestStore.getStore();
          if (!store?.user) {
            const row = await UserModel.findByPk(user.id);
            if (store && row) store.user = { id: row.id, email: row.email, role: row.role };
          }
        },
      },
    },
    session: {
      create: {
        before: async (session, context) => {
          const user = await context?.context.internalAdapter.findUserById(session.userId);
          if (
            !user ||
            Reflect.get(user, 'accountStatus') !== 'active' ||
            (user &&
              Reflect.get(user, 'role') === 'admin' &&
              (context?.path === '/sign-in/social' || context?.path.startsWith('/callback/')))
          )
            throw new APIError('FORBIDDEN', { message: 'Account is not active.' });
        },
      },
    },
  },
  plugins: [bearer(), openAPI({ disableDefaultReference: true })],
});
