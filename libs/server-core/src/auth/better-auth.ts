import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { APIError, betterAuth } from 'better-auth';
import { createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';
import { bearer, openAPI } from 'better-auth/plugins';
import type pg from 'pg';
import type { Transaction } from 'sequelize';
import type { AuditedTransaction } from '../audit/runtime.js';
import type { AuditAction, AuditInput } from '../audit/types.js';
import { requestStore } from '../request-store.js';

/** Better Auth endpoints (relative to `basePath`) and the audit action each one records. */
export const AUTH_AUDIT_ACTIONS: Record<string, AuditAction> = {
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

export interface AuthEmailRequest {
  userId: string;
  email: string;
  url: string;
  purpose: 'password_reset' | 'verify_email';
}

export interface BetterAuthFactoryOptions {
  /** Shown by Better Auth (e.g. in emails and OpenAPI). */
  appName: string;
  /** Public origin of the API, e.g. `https://api.example.com`. */
  baseURL: string;
  /** Mount path of the Better Auth handler. */
  basePath?: string;
  secret: string;
  /** Dedicated `pg` pool for Better Auth; close it on shutdown. */
  pool: pg.Pool;
  /** Web origins allowed to call auth endpoints with cookies. */
  trustedOrigins: string[];
  /** Production cookies are `Secure` and `SameSite=None`. */
  isProd: boolean;
  /** Cookie name prefix; keep Better Auth's default unless two apps share a cookie domain. */
  cookiePrefix?: string;
  /** Passwords that may never be set or used to sign in (see `createBlockedPasswordCheck`). */
  isBlockedPassword: (password: string) => boolean;
  /** Queue the reset / verification mail; called inside the auth request, not after commit. */
  sendAuthEmail: (request: AuthEmailRequest) => Promise<void>;
  /** Load the request user stored in the audit context (`id`, `email`, `role`). */
  loadUser: (id: string) => Promise<Express.User | null>;
  audit: {
    auditedTransaction: AuditedTransaction;
    recordAudit: (event: AuditInput, transaction: Transaction) => Promise<unknown>;
  };
  /** Roles that must not sign in with a social provider. */
  socialSignInBlockedRoles?: readonly string[];
  /** `users.role` of accounts created by sign-up or a first social sign-in (default `user`). */
  defaultRole?: string;
  /** Reject `/sign-up/email`; accounts are created by the app (seed, invitations). */
  disableSignUp?: boolean;
  google?: {
    clientId: string;
    clientSecret: string;
    /** Only existing users may sign in with Google; no account is created implicitly. */
    disableImplicitSignUp?: boolean;
  };
}

/**
 * Better Auth with the shared database layout (`users`, `auth_accounts`, `auth_sessions`,
 * `auth_verifications`, snake_case columns), bcrypt passwords, bearer tokens and audit rows for
 * every auth action listed in `AUTH_AUDIT_ACTIONS`.
 */
export function createBetterAuth(options: BetterAuthFactoryOptions) {
  const basePath = options.basePath ?? '/api/auth';
  const { auditedTransaction, recordAudit } = options.audit;
  const blockedSocialRoles = options.socialSignInBlockedRoles ?? [];

  const auditActionFor = (path: string) =>
    AUTH_AUDIT_ACTIONS[path] ?? (path.startsWith('/callback/') ? 'login' : undefined);

  const storeUser = async (id: string) => {
    const store = requestStore.getStore();
    const user = await options.loadUser(id);
    if (store && user) store.user = user;
  };

  return betterAuth({
    appName: options.appName,
    baseURL: options.baseURL,
    basePath,
    secret: options.secret,
    database: options.pool,
    trustedOrigins: options.trustedOrigins,
    advanced: {
      ...(options.cookiePrefix ? { cookiePrefix: options.cookiePrefix } : {}),
      database: { generateId: () => randomUUID() },
      defaultCookieAttributes: {
        httpOnly: true,
        secure: options.isProd,
        sameSite: options.isProd ? 'none' : 'lax',
      },
    },
    emailAndPassword: {
      enabled: true,
      ...(options.disableSignUp ? { disableSignUp: true } : {}),
      minPasswordLength: 8,
      maxPasswordLength: 128,
      password: {
        hash: (password) => {
          if (options.isBlockedPassword(password))
            throw new APIError('BAD_REQUEST', {
              message: 'This password is public; choose another.',
            });
          return bcrypt.hash(password, 12);
        },
        verify: async ({ hash, password }) =>
          !options.isBlockedPassword(password) && bcrypt.compare(password, hash),
      },
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        options.sendAuthEmail({
          userId: user.id,
          email: user.email,
          url,
          purpose: 'password_reset',
        }),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: ({ user, url }) =>
        options.sendAuthEmail({ userId: user.id, email: user.email, url, purpose: 'verify_email' }),
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
        role: { type: 'string', defaultValue: options.defaultRole ?? 'user', input: false },
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
      ...(options.google?.clientId ? { google: options.google } : {}),
    },
    hooks: {
      before: createAuthMiddleware(async (context) => {
        const action = auditActionFor(context.path);
        if (!action) return;
        const store = requestStore.getStore();
        if (store) {
          store.authAction = action;
          store.route = `${basePath}${context.path.startsWith('/callback/') ? '/callback/:provider' : context.path}`;
        }
        const session = await getSessionFromCtx(context, { disableRefresh: true }).catch(
          () => null,
        );
        if (store && session) await storeUser(session.user.id);
      }),
      after: createAuthMiddleware(async (context) => {
        const action = auditActionFor(context.path);
        if (!action) return;
        const returned = context.context.returned;
        const failed = returned instanceof APIError;
        const user =
          context.context.newSession?.user ??
          context.context.session?.user ??
          requestStore.getStore()?.user;
        const store = requestStore.getStore();
        if (store && user) await storeUser(user.id);
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
            if (!store?.user) await storeUser(user.id);
          },
        },
      },
      session: {
        create: {
          before: async (session, context) => {
            const user = await context?.context.internalAdapter.findUserById(session.userId);
            const role: unknown = user ? Reflect.get(user, 'role') : undefined;
            const social =
              context?.path === '/sign-in/social' || context?.path.startsWith('/callback/');
            if (
              !user ||
              Reflect.get(user, 'accountStatus') !== 'active' ||
              (social && blockedSocialRoles.some((blocked) => blocked === role))
            )
              throw new APIError('FORBIDDEN', { message: 'Account is not active.' });
          },
        },
      },
    },
    plugins: [bearer(), openAPI({ disableDefaultReference: true })],
  });
}
