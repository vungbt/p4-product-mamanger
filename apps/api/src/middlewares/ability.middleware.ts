import {
  type AbilityAction,
  type AbilitySubject,
  type AbilityUser,
  type AppAbility,
  canAccess,
  canOn,
  defineAbilityFor,
  type OwnedRecord,
} from '@p4/ability/shared';
import type { RequestHandler } from 'express';
import { Forbidden, Unauthorized } from '@/utils/errors/index.js';

const abilities = new WeakMap<AbilityUser, AppAbility>();

/** The CASL ability of a loaded user, built once per user object (one per request). */
export function abilityOf(user: AbilityUser): AppAbility {
  let ability = abilities.get(user);

  if (!ability) {
    ability = defineAbilityFor(user);
    abilities.set(user, ability);
  }

  return ability;
}

/** Unconditional access, e.g. staff features. Owner-only rules do not count. */
export function hasAccess(
  user: AbilityUser,
  action: AbilityAction,
  subjectType: AbilitySubject,
): boolean {
  return canAccess(abilityOf(user), action, subjectType);
}

export function assertAccess(
  user: AbilityUser,
  action: AbilityAction,
  subjectType: AbilitySubject,
): void {
  if (!hasAccess(user, action, subjectType)) throw new Forbidden();
}

/** Access to one record: the owner (`record.userId`) or staff with access. */
export function canAccessRecord(
  user: AbilityUser,
  action: AbilityAction,
  subjectType: AbilitySubject,
  record: OwnedRecord,
): boolean {
  return canOn(abilityOf(user), action, subjectType, record);
}

export function assertCanAccessRecord(
  user: AbilityUser,
  action: AbilityAction,
  subjectType: AbilitySubject,
  record: OwnedRecord,
): void {
  if (!canAccessRecord(user, action, subjectType, record)) throw new Forbidden();
}

/**
 * Route guard: the signed-in user needs unconditional `action` on `subjectType`.
 * `requiredAbility` (`action:Subject`) is read by the OpenAPI generator.
 */
export function requireAbility(
  action: AbilityAction,
  subjectType: AbilitySubject,
): RequestHandler & { requiredAbility: string } {
  const middleware: RequestHandler = (req, _res, next) => {
    try {
      if (!req.user) throw new Unauthorized();
      assertAccess(req.user, action, subjectType);
      next();
    } catch (error) {
      next(error);
    }
  };

  return Object.assign(middleware, { requiredAbility: `${action}:${subjectType}` });
}
