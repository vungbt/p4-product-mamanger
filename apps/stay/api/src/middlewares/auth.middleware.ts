import { createAuthRequired } from '@p4/server-core';
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

    return session ? loadActiveUser(session.user.id) : undefined;
  },
  assertRequest: assertCookieOrigin,
});
