import { AbilityBuilder, createMongoAbility, type RawRuleOf } from '@casl/ability';
import type { AbilityRule, StaffRole } from '@p4/shared';
import { ANY_ACTION, ANY_SUBJECT } from './actions.js';
import type { AbilityUser, AppAbility } from './types.js';

type Builder = AbilityBuilder<AppAbility>;

const abilityOptions = { anyAction: ANY_ACTION, anySubjectType: ANY_SUBJECT } as const;

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

export function createAppAbility(rules: readonly AbilityRule[] = []): AppAbility {
  return createMongoAbility<AppAbility>(rules as RawRuleOf<AppAbility>[], abilityOptions);
}

export function createAnonymousAbility(): AppAbility {
  return createAppAbility();
}

export function defineAbilityFor(user: AbilityUser): AppAbility {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);

  defineOwnerRules(builder, user.id);
  if (user.role === 'admin') STAFF_ROLE_DEFINITIONS[user.staffRole ?? 'owner'](builder);

  return builder.build(abilityOptions);
}

/** Unconditional rules granted by a staff role, for role listings. */
export function rulesForStaffRole(role: StaffRole): AbilityRule[] {
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);

  STAFF_ROLE_DEFINITIONS[role](builder);

  return builder.rules as AbilityRule[];
}

/** Serializable rules for clients; owner conditions only reference the user's own id. */
export function abilityRules(ability: AppAbility): AbilityRule[] {
  return ability.rules as AbilityRule[];
}
