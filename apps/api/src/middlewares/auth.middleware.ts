import type { Role } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { errorKeys } from '@/constants/index.js';
import { getMe, sessionFromHeaders } from '@/modules/auth/auth.service.js';
import { requestStore } from '@/shared/request-store.js';
import { Forbidden, Unauthorized } from '@/utils/errors/index.js';
import { assertCookieOrigin } from './cookie-origin.js';

export async function authRequired(req: Request, _res: Response, next: NextFunction) {
  try {
    const session = await sessionFromHeaders(req.headers);
    if (!session) throw new Unauthorized(errorKeys.invalidToken);
    const { user } = await getMe(session.user.id);
    req.user = user;
    const store = requestStore.getStore();
    if (store) store.user = user;
    assertCookieOrigin(req);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        throw new Forbidden();
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
