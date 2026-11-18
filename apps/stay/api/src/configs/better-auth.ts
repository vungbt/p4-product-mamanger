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
import { renderEmailLayout } from '@/modules/notifications/email-layout.js';
import { emailLogoUrl } from '@/modules/notifications/notifications.templates.js';
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

const AUTH_EMAILS: Record<
  AuthEmailRequest['purpose'],
  { subject: string; title: string; body: string; action: string }
> = {
  password_reset: {
    subject: '[Stay] Đặt mật khẩu tài khoản',
    title: 'Đặt mật khẩu tài khoản Stay',
    body: 'Có yêu cầu đặt mật khẩu cho tài khoản Stay gắn với địa chỉ email này (quên mật khẩu hoặc lời mời quản lý toà).\nBấm nút bên dưới để đặt mật khẩu mới. Liên kết chỉ dùng được một lần và sẽ hết hạn sau ít phút.',
    action: 'Đặt mật khẩu',
  },
  verify_email: {
    subject: '[Stay] Xác nhận địa chỉ email',
    title: 'Xác nhận địa chỉ email',
    body: 'Bấm nút bên dưới để xác nhận địa chỉ email của tài khoản Stay.',
    action: 'Xác nhận email',
  },
};

/**
 * Password reset (also used for manager invitations) and email verification go through the
 * SMTP transport with the shared email layout. Without SMTP the link is logged outside
 * production; production refuses.
 */
async function sendAuthEmail({ userId, email, url, purpose }: AuthEmailRequest) {
  if (!emailEnabled()) {
    if (env.isProd) throw new BaseError('mail_unavailable', 503, 'mail_unavailable');
    logger.info(JSON.stringify({ event: 'auth.mail_requested', userId, purpose, url }));
    return;
  }

  const copy = AUTH_EMAILS[purpose];
  const { html, text } = renderEmailLayout({
    subject: copy.subject,
    tone: 'account',
    context: 'Quản lý nhà trọ',
    logoUrl: emailLogoUrl(),
    title: copy.title,
    body: copy.body,
    action: { label: copy.action, url },
    footer: 'Nếu bạn không yêu cầu, hãy bỏ qua email này; mật khẩu hiện tại không thay đổi.',
  });

  await smtpTransport.send({ id: randomUUID(), to: email, subject: copy.subject, text, html });
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
