import type { Role, User } from '@p4/shared';
import jwt from 'jsonwebtoken';
import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
import { isAppError, Unauthorized } from '@/utils/errors/index.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  ver: number;
  sid?: string;
}

export function signAccessToken(user: User, version = 0, sessionId?: string): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    ver: version,
    ...(sessionId ? { sid: sessionId } : {}),
  };
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    if (
      typeof decoded === 'string' ||
      !decoded.sub ||
      !decoded.email ||
      (decoded.role !== 'admin' && decoded.role !== 'user') ||
      (decoded.ver !== undefined && (!Number.isSafeInteger(decoded.ver) || decoded.ver < 0))
    ) {
      throw new Unauthorized(errorKeys.invalidToken);
    }
    return {
      sub: String(decoded.sub),
      email: String(decoded.email),
      role: decoded.role,
      ver: typeof decoded.ver === 'number' ? decoded.ver : 0,
      ...(typeof decoded.sid === 'string' ? { sid: decoded.sid } : {}),
    };
  } catch (error) {
    if (isAppError(error)) throw error;
    throw new Unauthorized(errorKeys.invalidToken);
  }
}
