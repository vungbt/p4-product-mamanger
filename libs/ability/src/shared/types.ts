import type { ForcedSubject, MongoAbility } from '@casl/ability';
import type { AbilityAction, AbilitySubject, Role, StaffRole } from '@p4/shared';
import type { ANY_ACTION, ANY_SUBJECT } from './actions.js';

/** Record attributes used by conditional rules (owner-scoped records). */
export interface OwnedRecord {
  userId: string;
}

export type AbilitySubjectInstance = OwnedRecord & ForcedSubject<AbilitySubject>;

export type AppAbility = MongoAbility<
  [AbilityAction | typeof ANY_ACTION, AbilitySubject | typeof ANY_SUBJECT | AbilitySubjectInstance]
>;

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
