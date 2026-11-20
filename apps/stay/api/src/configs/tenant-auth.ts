import { randomUUID } from 'node:crypto';
import { normalizePhone } from '@stay/shared';
import { fromNodeHeaders } from 'better-auth/node';
import { TenantModel, UserModel } from '@/sequelize/models/index.js';
import { auth } from './better-auth.js';

/** Better Auth still owns password verification, sessions, errors and auth audit. The
 * identifier is resolved inside the rate-limited handler, never through a public lookup. */
export const tenantAuth = {
  async handler(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;

    if (path.endsWith('/change-password') && request.method === 'POST') {
      const body: unknown = await request
        .clone()
        .json()
        .catch(() => null);

      if (
        body &&
        typeof body === 'object' &&
        'newPassword' in body &&
        'currentPassword' in body &&
        body.newPassword === body.currentPassword
      )
        return Response.json(
          { code: 'PASSWORD_UNCHANGED', message: 'Choose a new password.' },
          { status: 400 },
        );
    }

    if (path.endsWith('/sign-in/email') && request.method === 'POST') {
      const body: unknown = await request
        .clone()
        .json()
        .catch(() => null);

      if (body && typeof body === 'object' && 'email' in body && typeof body.email === 'string') {
        const identifier = body.email.trim().toLowerCase();
        const phone = normalizePhone(identifier);
        let email = identifier;

        if (!identifier.includes('@')) {
          const tenants = phone
            ? await TenantModel.findAll({ where: { phone, archivedAt: null }, limit: 2 })
            : [];
          const account =
            tenants.length === 1 && tenants[0]?.userId
              ? await UserModel.findOne({ where: { id: tenants[0].userId, role: 'tenant' } })
              : null;

          email = account?.email ?? `unknown-${randomUUID()}@accounts.stay.invalid`;
        }
        request = new Request(request, { body: JSON.stringify({ ...body, email }) });
      }
    }

    // A temporary session can only inspect itself, change its password or sign out.
    if (
      !['/sign-in/email', '/get-session', '/change-password', '/sign-out'].some((suffix) =>
        path.endsWith(suffix),
      )
    ) {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(Object.fromEntries(request.headers)),
        query: { disableRefresh: true },
      });
      const user = session ? await UserModel.findByPk(session.user.id) : null;

      if (user?.mustChangePassword)
        return Response.json(
          { code: 'MUST_CHANGE_PASSWORD', message: 'must_change_password' },
          { status: 403 },
        );
    }
    return auth.handler(request);
  },
};
