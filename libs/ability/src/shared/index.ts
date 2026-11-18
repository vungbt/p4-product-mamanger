export type { AbilityAction, AbilityRule, AbilitySubject } from '@p4/shared';
export { canAccess, canOn } from './access.js';
export { ABILITY_ACTIONS, ABILITY_SUBJECTS, ANY_ACTION, ANY_SUBJECT } from './actions.js';
export {
  abilityRules,
  createAnonymousAbility,
  createAppAbility,
  defineAbilityFor,
  p4AbilityKit,
  rulesForStaffRole,
} from './builder.js';
export type {
  AbilityCheck,
  AbilitySubjectInstance,
  AbilityUser,
  AppAbility,
  OwnedRecord,
} from './types.js';
