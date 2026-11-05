import type { Permission, StaffRole, User } from '@p4/shared';
import type { RequestHandler } from 'express';
import { PERMISSIONS } from '@/shared/commerce/contracts.js';
import { Forbidden, Unauthorized } from '@/utils/errors/index.js';

export const STAFF_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  owner: PERMISSIONS,
  administrator: PERMISSIONS.filter(
    (permission) => !['system:manage', 'staff:manage'].includes(permission),
  ),
  catalog: [
    'catalog:read',
    'catalog:write',
    'inventory:read',
    'inventory:write',
    'promotion:read',
    'promotion:write',
    'review:read',
  ],
  content: ['content:read', 'content:write', 'content:publish', 'catalog:read'],
  support: [
    'customer:read',
    'order:read',
    'return:read',
    'review:read',
    'review:reply',
    'support:read',
    'support:manage',
  ],
  fulfillment: ['order:read', 'fulfillment:read', 'fulfillment:manage', 'inventory:read'],
};

export function permissionsFor(user: Pick<User, 'role' | 'staffRole'>): Permission[] {
  if (user.role !== 'admin') return [];
  return [...STAFF_PERMISSIONS[user.staffRole ?? 'owner']];
}

export function requirePermission(permission: Permission): RequestHandler {
  const middleware: RequestHandler = (req, _res, next) => {
    try {
      if (!req.user) throw new Unauthorized();
      if (!permissionsFor(req.user).includes(permission)) throw new Forbidden();
      next();
    } catch (error) {
      next(error);
    }
  };
  return Object.assign(middleware, { requiredPermission: permission });
}
