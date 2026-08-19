import type { Role } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { errorKeys } from '@/constants/index.js';
import { findUserByToken } from '@/modules/auth/auth.service.js';
import { Forbidden, Unauthorized } from '@/utils/errors/index.js';

export async function authRequired(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new Unauthorized();
    }
    const token = header.slice(7);
    const user = await findUserByToken(token);
    if (!user) {
      throw new Unauthorized(errorKeys.invalidToken);
    }
    req.user = user;
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
