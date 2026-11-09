import type { AbilityAction, AbilitySubject } from '@p4/shared';
import { p4AbilityKit } from './builder.js';
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
  return p4AbilityKit.canAccess(ability, action, subjectType);
}

/** Whether `ability` grants `action` on one record, honouring owner conditions. */
export function canOn(
  ability: AppAbility,
  action: AbilityAction,
  subjectType: AbilitySubject,
  record: OwnedRecord,
): boolean {
  return p4AbilityKit.canOn(ability, action, subjectType, record);
}
