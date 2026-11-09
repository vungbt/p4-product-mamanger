import { createAbilityGuards } from '@p4/server-core';
import { stayAbilityKit } from '@stay/shared';

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
