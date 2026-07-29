import type { Role, User } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { passwords, sessions, users } from '../data/store.js';

export interface AuthedRequest extends Request {
  user?: User;
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.slice(7);
  const userId = sessions.get(token);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  req.user = user;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

export function issueToken(userId: string) {
  const token = `tok_${userId}_${Date.now()}`;
  sessions.set(token, userId);
  return token;
}

export function validateCredentials(email: string, password: string): User | null {
  const user = users.find((u) => u.email === email);
  if (!user || passwords[email] !== password) {
    return null;
  }
  return user;
}
