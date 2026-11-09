import { subject as caslSubject } from '@casl/ability';
import type { AbilityAction, AbilitySubject } from '@p4/shared';
import type { AppAbility, OwnedRecord } from './types.js';

/**
 * Whether `ability` grants `action` on every `subjectType` record.
 *
 * Use this for route guards, menus and other checks without a record. Unlike
 * `ability.can(action, 'Order')`, owner-scoped rules (`{ userId }`) do not count,
 * so a customer who can read their own orders cannot open the order admin.
 * A conditional `cannot` also denies, because some records are excluded.
 */
export function canAccess(
  ability: AppAbility,
  action: AbilityAction,
  subjectType: AbilitySubject,
): boolean {
  for (const rule of ability.rulesFor(action, subjectType)) {
    if (rule.inverted) return false;
    if (!rule.conditions) return true;
  }

  return false;
}

/** Whether `ability` grants `action` on one record, honouring owner conditions. */
export function canOn(
  ability: AppAbility,
  action: AbilityAction,
  subjectType: AbilitySubject,
  record: OwnedRecord,
): boolean {
  return ability.can(action, caslSubject(subjectType, { userId: record.userId }));
}
