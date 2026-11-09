import type { AbilityKit, KitAbility } from '@p4/ability/core';
import type { Request, RequestHandler } from 'express';
import { Forbidden, Unauthorized } from '../shared/errors.js';

/** The part of an app's ability kit (`createAbilityKit`) the guards use. */
export type AbilityGuardKit<
  Action extends string,
  Subject extends string,
  User extends object,
  Attrs extends object,
> = Pick<AbilityKit<Action, Subject, User, Attrs>, 'defineAbilityFor' | 'canAccess' | 'canOn'>;

export interface AbilityGuardOptions<User extends object> {
  /** The kit user of the signed-in request, or `undefined` when signed out (after `authRequired`). */
  getUser: (req: Request) => User | undefined;
}

/**
 * Express guards for one app's CASL kit. Abilities are built once per user object (one per
 * request when `authRequired` loads the user).
 *
 * - `requireAbility(action, subject)`: route guard for unconditional access; carries
 *   `requiredAbility` (`action:Subject`) for the OpenAPI generator.
 * - `hasAccess` / `assertAccess`: unconditional access (record-scoped rules do not count).
 * - `canAccessRecord` / `assertCanAccessRecord`: one record, honouring conditions.
 */
export function createAbilityGuards<
  Action extends string,
  Subject extends string,
  User extends object,
  Attrs extends object,
>(kit: AbilityGuardKit<Action, Subject, User, Attrs>, options: AbilityGuardOptions<User>) {
  const abilities = new WeakMap<User, KitAbility<Action, Subject, Attrs>>();

  function abilityOf(user: User): KitAbility<Action, Subject, Attrs> {
    let ability = abilities.get(user);

    if (!ability) {
      ability = kit.defineAbilityFor(user);
      abilities.set(user, ability);
    }

    return ability;
  }

  function hasAccess(user: User, action: Action, subjectType: Subject): boolean {
    return kit.canAccess(abilityOf(user), action, subjectType);
  }

  function assertAccess(user: User, action: Action, subjectType: Subject): void {
    if (!hasAccess(user, action, subjectType)) throw new Forbidden();
  }

  function canAccessRecord(user: User, action: Action, subjectType: Subject, record: Attrs) {
    return kit.canOn(abilityOf(user), action, subjectType, record);
  }

  function assertCanAccessRecord(
    user: User,
    action: Action,
    subjectType: Subject,
    record: Attrs,
  ): void {
    if (!canAccessRecord(user, action, subjectType, record)) throw new Forbidden();
  }

  function requireAbility(
    action: Action,
    subjectType: Subject,
  ): RequestHandler & { requiredAbility: string } {
    const middleware: RequestHandler = (req, _res, next) => {
      try {
        const user = options.getUser(req);

        if (!user) throw new Unauthorized();
        assertAccess(user, action, subjectType);
        next();
      } catch (error) {
        next(error);
      }
    };

    return Object.assign(middleware, { requiredAbility: `${action}:${subjectType}` });
  }

  return {
    abilityOf,
    hasAccess,
    assertAccess,
    canAccessRecord,
    assertCanAccessRecord,
    requireAbility,
  };
}
