import { BaseError, createAuthRequired } from '@p4/server-core';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '@/configs/better-auth.js';
import { loadActiveUser } from '@/modules/me/me.service.js';
import { assertCookieOrigin } from './cookie-origin.js';

/** Better Auth session (cookie `stay.session_token` or bearer token) of an active account. */
export const authRequired = createAuthRequired({
  resolveUser: async (req) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
      query: { disableRefresh: true },
    });

    const user = session ? await loadActiveUser(session.user.id) : undefined;

    if (user?.mustChangePassword && req.path !== '/me')
      throw new BaseError('must_change_password', 403, 'must_change_password');
    if (user?.role === 'tenant' && !['/me', '/me/capabilities'].includes(req.path))
      throw new BaseError('forbidden', 403, 'forbidden');
    return user;
  },
  assertRequest: assertCookieOrigin,
});
