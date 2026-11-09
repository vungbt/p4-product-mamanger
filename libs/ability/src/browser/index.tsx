import {
  type CanProps,
  AbilityProvider as CaslAbilityProvider,
  Can as CaslCan,
  useAbility as caslUseAbility,
} from '@casl/react';
import type { AbilityAction, AbilityRule, AbilitySubject } from '@p4/shared';
import { type ReactNode, useMemo } from 'react';
import { canAccess, canOn } from '../shared/access.js';
import { createAppAbility } from '../shared/builder.js';
import type { AppAbility, OwnedRecord } from '../shared/types.js';

export type { AppAbility } from '../shared/types.js';

export interface AbilityProviderProps {
  /** Rules from `GET /api/me/capabilities`; omit or pass `[]` for no access. */
  rules?: readonly AbilityRule[];
  children: ReactNode;
}

const NO_RULES: readonly AbilityRule[] = [];

export function AbilityProvider({ rules = NO_RULES, children }: AbilityProviderProps) {
  const ability = useMemo(() => createAppAbility(rules), [rules]);

  return <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>;
}

export function useAbility(): AppAbility {
  return caslUseAbility<AppAbility>();
}

/** Unconditional access, for routes, menus and toolbar actions. See `canAccess`. */
export function useCanAccess(action: AbilityAction, subjectType: AbilitySubject): boolean {
  return canAccess(useAbility(), action, subjectType);
}

/** Access to one owner-scoped record. */
export function useCanOn(
  action: AbilityAction,
  subjectType: AbilitySubject,
  record: OwnedRecord,
): boolean {
  return canOn(useAbility(), action, subjectType, record);
}

/**
 * CASL's `<Can>` typed for P4. With a subject type (`a="Order"`) it also passes for
 * owner-only rules; use `useCanAccess` when the check must cover every record.
 */
export const Can = CaslCan as (props: CanProps<AppAbility>) => ReactNode;
