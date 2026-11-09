import type { AbilityAction, AbilityRule, AbilitySubject, StaffRole } from '@p4/shared';
import { createAbilityKit, type KitBuilder } from '../core/index.js';
import { ABILITY_ACTIONS, ABILITY_SUBJECTS, ANY_ACTION, ANY_SUBJECT } from './actions.js';
import type { AbilityUser, AppAbility, OwnedRecord } from './types.js';

type Builder = KitBuilder<AbilityAction, AbilitySubject, OwnedRecord>;

/**
 * Staff rules per role. Every staff role keeps the exact access of the former
 * `STAFF_PERMISSIONS` table (`<subject>:<action>`).
 */
const STAFF_ROLE_DEFINITIONS: Record<StaffRole, (builder: Builder) => void> = {
  owner: ({ can }) => {
    can(ANY_ACTION, ANY_SUBJECT);
  },
  administrator: ({ can, cannot }) => {
    can(ANY_ACTION, ANY_SUBJECT);
    cannot('manage', ['System', 'Staff']);
  },
  catalog: ({ can }) => {
    can(['read', 'write'], ['Catalog', 'Inventory', 'Promotion']);
    can('read', 'Review');
  },
  content: ({ can }) => {
    can(['read', 'write', 'publish'], 'Content');
    can('read', 'Catalog');
  },
  support: ({ can }) => {
    can('read', ['Customer', 'Order', 'Return', 'Review', 'Support']);
    can('reply', 'Review');
    can('manage', 'Support');
  },
  fulfillment: ({ can }) => {
    can('read', ['Order', 'Fulfillment', 'Inventory']);
    can('manage', 'Fulfillment');
  },
};

/**
 * Every signed-in user can act on records they own. Staff rules add
 * unconditional access on top of these.
 */
function defineOwnerRules({ can }: Builder, userId: string) {
  const own = { userId };

  can(['read', 'manage'], 'Order', own);
  can('manage', 'Payment', own);
  can('read', ['Return', 'Refund'], own);
  can(['read', 'manage'], 'Support', own);
  can('moderate', 'Review', own);
}

/** The P4 kit: actions, subjects and staff/owner rules on top of `@p4/ability/core`. */
export const p4AbilityKit = createAbilityKit<
  AbilityAction,
  AbilitySubject,
  AbilityUser,
  OwnedRecord
>({
  actions: ABILITY_ACTIONS,
  subjects: ABILITY_SUBJECTS,
  define(builder, user) {
    defineOwnerRules(builder, user.id);
    if (user.role === 'admin') STAFF_ROLE_DEFINITIONS[user.staffRole ?? 'owner'](builder);
  },
  // Owner conditions only reference `userId`; other record fields are never matched.
  recordAttributes: (record) => ({ userId: record.userId }),
});

export function createAppAbility(rules: readonly AbilityRule[] = []): AppAbility {
  return p4AbilityKit.createAppAbility(rules);
}

export function createAnonymousAbility(): AppAbility {
  return createAppAbility();
}

export function defineAbilityFor(user: AbilityUser): AppAbility {
  return p4AbilityKit.defineAbilityFor(user);
}

/** Unconditional rules granted by a staff role, for role listings. */
export function rulesForStaffRole(role: StaffRole): AbilityRule[] {
  return p4AbilityKit.rulesFrom(STAFF_ROLE_DEFINITIONS[role]) as AbilityRule[];
}

/** Serializable rules for clients; owner conditions only reference the user's own id. */
export function abilityRules(ability: AppAbility): AbilityRule[] {
  return p4AbilityKit.abilityRules(ability) as AbilityRule[];
}
