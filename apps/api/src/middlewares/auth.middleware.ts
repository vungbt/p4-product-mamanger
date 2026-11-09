import { createAuthRequired } from '@p4/server-core';
import { getMe, sessionFromHeaders } from '@/modules/auth/auth.service.js';
import { assertCookieOrigin } from './cookie-origin.js';

export const authRequired = createAuthRequired({
  resolveUser: async (req) => {
    const session = await sessionFromHeaders(req.headers);
    return session ? (await getMe(session.user.id)).user : undefined;
  },
  assertRequest: assertCookieOrigin,
});

export { requireRole } from '@p4/server-core';
