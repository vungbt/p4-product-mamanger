import { createAbilityGuards, Forbidden, Unauthorized } from '@p4/server-core';
import { type StayAction, type StaySubject, type StayUser, stayAbilityKit } from '@stay/shared';
import type { RequestHandler } from 'express';

/**
 * Stay authorization (CASL). Guard routes with `requireAbility(action, subject)` after
 * `authRequired`; check one record with `canAccessRecord` / `assertCanAccessRecord`
 * (`{ buildingId, contractId }`), never with inline user/building comparisons.
 */
export const {
  abilityOf,
  hasAccess,
  assertAccess,
  canAccessRecord,
  assertCanAccessRecord,
  requireAbility,
} = createAbilityGuards(stayAbilityKit, { getUser: (req) => req.user });

/**
 * Route guard for record-scoped areas (e.g. a manager reads only assigned buildings): passes when
 * some rule, conditional or not, grants `action` on `subject`. The handler must still scope its
 * query (`accessibleBuildingIds`) or check the record (`canAccessRecord`).
 */
export function requireScopedAbility(
  action: StayAction,
  subject: StaySubject,
): RequestHandler & { requiredAbility: string } {
  const middleware: RequestHandler = (req, _res, next) => {
    try {
      if (!req.user) throw new Unauthorized();
      if (!abilityOf(req.user).can(action, subject)) throw new Forbidden();
      next();
    } catch (error) {
      next(error);
    }
  };

  return Object.assign(middleware, { requiredAbility: `${action}:${subject}` });
}

/**
 * Buildings `user` may `action`: `'all'` when the ability is unconditional, else the assigned
 * buildings the conditional rules accept.
 */
export function accessibleBuildingIds(user: StayUser, action: StayAction): 'all' | string[] {
  if (hasAccess(user, action, 'Building')) return 'all';

  return user.buildingIds.filter((buildingId) =>
    canAccessRecord(user, action, 'Building', { buildingId }),
  );
}
