import {
  type CanProps,
  AbilityProvider as CaslAbilityProvider,
  Can as CaslCan,
  useAbility as caslUseAbility,
} from '@casl/react';
import type { AbilityAction, AbilitySubject } from '@p4/shared';
import { type ReactNode, useMemo } from 'react';
import type { ClientAbilityKit, KitAbility, KitRule, RecordAttributes } from '../core/index.js';
import { p4AbilityKit } from '../shared/builder.js';

export type { AppAbility } from '../shared/types.js';

export interface AbilityProviderProps<
  Action extends string = AbilityAction,
  Subject extends string = AbilitySubject,
> {
  /** Serialized rules from the API (P4: `GET /api/me/capabilities`); omit or pass `[]` for no access. */
  rules?: readonly KitRule<Action, Subject>[];
  children: ReactNode;
}

export interface AbilityReact<Action extends string, Subject extends string, Attrs extends object> {
  AbilityProvider: (props: AbilityProviderProps<Action, Subject>) => ReactNode;
  useAbility: () => KitAbility<Action, Subject, Attrs>;
  /** Unconditional access, for routes, menus and toolbar actions. See `canAccess`. */
  useCanAccess: (action: Action, subjectType: Subject) => boolean;
  /** Access to at least one record, counting conditional rules. See `canAccessSome`. */
  useCanAccessSome: (action: Action, subjectType: Subject) => boolean;
  /** Access to one record, honouring conditional rules. See `canOn`. */
  useCanOn: (action: Action, subjectType: Subject, record: Attrs) => boolean;
  /**
   * CASL's `<Can>` typed for the app. With a subject type (`a="Order"`) it also passes
   * for conditional rules; use `useCanAccess` when the check must cover every record.
   */
  Can: (props: CanProps<KitAbility<Action, Subject, Attrs>>) => ReactNode;
}

const NO_RULES: readonly never[] = [];

/**
 * React bindings for one app kit. Each web mounts a single `AbilityProvider` at its
 * root (CASL's React context is shared, one ability per page).
 */
export function createAbilityReact<
  Action extends string,
  Subject extends string,
  Attrs extends object = RecordAttributes,
>(kit: ClientAbilityKit<Action, Subject, Attrs>): AbilityReact<Action, Subject, Attrs> {
  type Ability = KitAbility<Action, Subject, Attrs>;

  function AbilityProvider({ rules = NO_RULES, children }: AbilityProviderProps<Action, Subject>) {
    const ability = useMemo(() => kit.createAppAbility(rules), [rules]);

    return <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>;
  }

  function useAbility(): Ability {
    return caslUseAbility<Ability>();
  }

  function useCanAccess(action: Action, subjectType: Subject): boolean {
    return kit.canAccess(useAbility(), action, subjectType);
  }

  function useCanAccessSome(action: Action, subjectType: Subject): boolean {
    return kit.canAccessSome(useAbility(), action, subjectType);
  }

  function useCanOn(action: Action, subjectType: Subject, record: Attrs): boolean {
    return kit.canOn(useAbility(), action, subjectType, record);
  }

  const Can: (props: CanProps<Ability>) => ReactNode = CaslCan;

  return { AbilityProvider, useAbility, useCanAccess, useCanAccessSome, useCanOn, Can };
}

/** P4 bindings, typed with `@p4/shared` actions and subjects. */
export const { AbilityProvider, useAbility, useCanAccess, useCanOn, Can } =
  createAbilityReact(p4AbilityKit);
