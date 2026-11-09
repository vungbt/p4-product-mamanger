import type { NextFunction, Request, Response } from 'express';
import { requestStore } from '../request-store.js';
import { Forbidden, Unauthorized } from '../shared/errors.js';

export interface AuthRequiredOptions {
  /** Load the active user for the request's session, or `undefined` when signed out. */
  resolveUser: (req: Request) => Promise<Express.User | undefined>;
  /** Extra check after the user is known, e.g. the guard from `createCookieOriginGuard`. */
  assertRequest?: (req: Request) => void;
}

/**
 * Build the `authRequired` middleware. The returned function keeps the name `authRequired`,
 * which the OpenAPI generator uses to mark secured routes.
 */
export function createAuthRequired({ resolveUser, assertRequest }: AuthRequiredOptions) {
  return async function authRequired(req: Request, _res: Response, next: NextFunction) {
    try {
      const user = await resolveUser(req);
      if (!user) throw new Unauthorized('invalid_token');
      req.user = user;
      const store = requestStore.getStore();
      if (store) store.user = user;
      assertRequest?.(req);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Allow only users whose `role` is listed; use after `authRequired`. */
export function requireRole<Role extends string>(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const role = req.user && 'role' in req.user ? req.user.role : undefined;
      if (!roles.some((allowed) => allowed === role)) {
        throw new Forbidden();
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
