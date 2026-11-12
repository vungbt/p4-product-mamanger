import { randomUUID } from 'node:crypto';
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
import { smtpTransport } from '@/modules/notifications/notifications.transports.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { emailEnabled, env } from './env.js';
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

const AUTH_EMAIL_COPY: Record<AuthEmailRequest['purpose'], { subject: string; action: string }> = {
  password_reset: {
    subject: '[Stay] Đặt mật khẩu tài khoản',
    action: 'Bấm vào liên kết dưới đây để đặt mật khẩu cho tài khoản Stay của bạn:',
  },
  verify_email: {
    subject: '[Stay] Xác nhận địa chỉ email',
    action: 'Bấm vào liên kết dưới đây để xác nhận địa chỉ email của bạn:',
  },
};

/**
 * Password reset (also used for manager invitations) and email verification go through the
 * SMTP transport. Without SMTP the link is logged outside production; production refuses.
 */
async function sendAuthEmail({ userId, email, url, purpose }: AuthEmailRequest) {
  if (!emailEnabled()) {
    if (env.isProd) throw new BaseError('mail_unavailable', 503, 'mail_unavailable');
    logger.info(JSON.stringify({ event: 'auth.mail_requested', userId, purpose, url }));
    return;
  }

  const copy = AUTH_EMAIL_COPY[purpose];
  const ignore = 'Nếu bạn không yêu cầu, hãy bỏ qua email này.';

  await smtpTransport.send({
    id: randomUUID(),
    to: email,
    subject: copy.subject,
    text: `${copy.action}\n\n${url}\n\n${ignore}`,
    html: `<p>${copy.action}</p><p><a href="${encodeURI(url)}">${encodeURI(url)}</a></p><p>${ignore}</p>`,
  });
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
