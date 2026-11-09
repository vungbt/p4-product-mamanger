import type { AbilityAction, AbilitySubject, Role, StaffRole } from '@p4/shared';
import type { KitAbility, KitSubjectInstance } from '../core/index.js';

/** Record attributes used by conditional rules (owner-scoped records). */
export interface OwnedRecord {
  userId: string;
}

export type AbilitySubjectInstance = KitSubjectInstance<AbilitySubject, OwnedRecord>;

export type AppAbility = KitAbility<AbilityAction, AbilitySubject, OwnedRecord>;

/** A check against unconditional access, e.g. a route or menu requirement. */
export interface AbilityCheck {
  action: AbilityAction;
  subject: AbilitySubject;
}

/** The user fields needed to build an ability. */
export interface AbilityUser {
  id: string;
  role: Role;
  staffRole?: StaffRole | null;
}
