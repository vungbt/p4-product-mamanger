import {
  AbilityBuilder,
  type AnyMongoAbility,
  subject as caslSubject,
  createMongoAbility,
  type ForcedSubject,
  type MongoAbility,
  type RawRuleOf,
} from '@casl/ability';

/** CASL wildcard for every action (`anyAction`), so `manage` stays an ordinary action. */
export const ANY_ACTION = '*';
/** CASL wildcard for every subject type (`anySubjectType`). */
export const ANY_SUBJECT = 'all';

export type AnyAction = typeof ANY_ACTION;
export type AnySubject = typeof ANY_SUBJECT;

/** Attributes of one record that conditional rules are matched against. */
export type RecordAttributes = Record<string, unknown>;

/**
 * A record tagged with its subject type, as CASL checks it. Distributed per subject so
 * builder conditions (`can('read', 'Invoice', { buildingId: { $in } })`) are typed.
 */
export type KitSubjectInstance<
  Subject extends string,
  Attrs extends object,
> = Subject extends unknown ? Attrs & ForcedSubject<Subject> : never;

/** The CASL ability of an app with its own actions, subjects and record attributes. */
export type KitAbility<
  Action extends string,
  Subject extends string,
  Attrs extends object = RecordAttributes,
> = MongoAbility<[Action | AnyAction, Subject | AnySubject | KitSubjectInstance<Subject, Attrs>]>;

export type KitBuilder<
  Action extends string,
  Subject extends string,
  Attrs extends object = RecordAttributes,
> = AbilityBuilder<KitAbility<Action, Subject, Attrs>>;

/** Serializable rule sent to clients. Conditions use CASL's Mongo query syntax. */
export interface KitRule<Action extends string, Subject extends string> {
  action: Action | AnyAction | Array<Action | AnyAction>;
  subject: Subject | AnySubject | Array<Subject | AnySubject>;
  conditions?: Record<string, unknown>;
  inverted?: boolean;
}

/** What an app declares to get its typed ability kit. */
export interface AbilityKitDefinition<
  Action extends string,
  Subject extends string,
  User,
  Attrs extends object = RecordAttributes,
> {
  /** Every action the app checks (documentation and listings; `*` is implicit). */
  actions: readonly Action[];
  /** Every subject the app protects (`all` is implicit). */
  subjects: readonly Subject[];
  /** Adds the rules of one signed-in user, e.g. per role. */
  define: (builder: KitBuilder<Action, Subject, Attrs>, user: User) => void;
  /**
   * Attributes of a record passed to `canOn`. Defaults to a shallow copy of the record.
   * Return only the fields your conditions use (e.g. `{ userId }`, `{ buildingId }`).
   */
  recordAttributes?: (record: Attrs) => Attrs;
}

export interface AbilityKit<
  Action extends string,
  Subject extends string,
  User,
  Attrs extends object = RecordAttributes,
> {
  readonly actions: readonly Action[];
  readonly subjects: readonly Subject[];
  /** Builds the ability of a signed-in user from the app definition. */
  defineAbilityFor(user: User): KitAbility<Action, Subject, Attrs>;
  /** Rebuilds an ability from serialized rules; no rules means no access. */
  createAppAbility(rules?: readonly KitRule<Action, Subject>[]): KitAbility<Action, Subject, Attrs>;
  /** Rules collected from a partial definition, e.g. one role for role listings. */
  rulesFrom(
    define: (builder: KitBuilder<Action, Subject, Attrs>) => void,
  ): KitRule<Action, Subject>[];
  /** Serializable rules for clients. */
  abilityRules(ability: KitAbility<Action, Subject, Attrs>): KitRule<Action, Subject>[];
  /**
   * Whether `ability` grants `action` on every `subjectType` record.
   *
   * Conditional rules do not count, so record-scoped access (`{ userId }`,
   * `{ buildingId: { $in } }`) never opens a whole area. A conditional `cannot`
   * also denies, because some records are excluded.
   */
  canAccess(
    ability: KitAbility<Action, Subject, Attrs>,
    action: Action,
    subjectType: Subject,
  ): boolean;
  /**
   * Whether `ability` grants `action` on at least one `subjectType` record, counting
   * conditional rules (`{ buildingId: { $in } }`). For areas whose data the API already
   * filters per record; use `canAccess` when the check must cover every record.
   */
  canAccessSome(
    ability: KitAbility<Action, Subject, Attrs>,
    action: Action,
    subjectType: Subject,
  ): boolean;
  /** Whether `ability` grants `action` on one record, honouring conditional rules. */
  canOn(
    ability: KitAbility<Action, Subject, Attrs>,
    action: Action,
    subjectType: Subject,
    record: Attrs,
  ): boolean;
}

/** The client-side part of a kit used by `@p4/ability/browser`. */
export type ClientAbilityKit<
  Action extends string,
  Subject extends string,
  Attrs extends object = RecordAttributes,
> = Pick<
  AbilityKit<Action, Subject, never, Attrs>,
  'createAppAbility' | 'canAccess' | 'canAccessSome' | 'canOn'
>;

const abilityOptions = { anyAction: ANY_ACTION, anySubjectType: ANY_SUBJECT } as const;

/** Creates the typed CASL helpers of one app. */
export function createAbilityKit<
  Action extends string,
  Subject extends string,
  User,
  Attrs extends object = RecordAttributes,
>(
  definition: AbilityKitDefinition<Action, Subject, User, Attrs>,
): AbilityKit<Action, Subject, User, Attrs> {
  type Ability = KitAbility<Action, Subject, Attrs>;
  type Rule = KitRule<Action, Subject>;

  const recordAttributes = definition.recordAttributes ?? ((record: Attrs) => ({ ...record }));

  function createAppAbility(rules: readonly Rule[] = []): Ability {
    return createMongoAbility<Ability>(rules as RawRuleOf<Ability>[], abilityOptions);
  }

  function rulesFrom(define: (builder: KitBuilder<Action, Subject, Attrs>) => void): Rule[] {
    const builder = new AbilityBuilder<Ability>(createMongoAbility);

    define(builder);

    return builder.rules as Rule[];
  }

  return {
    actions: definition.actions,
    subjects: definition.subjects,
    createAppAbility,
    rulesFrom,
    defineAbilityFor(user) {
      const builder = new AbilityBuilder<Ability>(createMongoAbility);

      definition.define(builder, user);

      return builder.build(abilityOptions);
    },
    abilityRules(ability) {
      return ability.rules as Rule[];
    },
    // CASL cannot resolve its overloads for generic tuples; the public signatures stay typed.
    canAccess(ability: AnyMongoAbility, action, subjectType) {
      for (const rule of ability.rulesFor(action, subjectType)) {
        if (rule.inverted) return false;
        if (!rule.conditions) return true;
      }

      return false;
    },
    canAccessSome(ability: AnyMongoAbility, action, subjectType) {
      // Rules come in priority order: an unconditional `cannot` closes the area, any `can`
      // (conditional or not) opens some records; a conditional `cannot` excludes only some.
      for (const rule of ability.rulesFor(action, subjectType)) {
        if (!rule.inverted) return true;
        if (!rule.conditions) return false;
      }

      return false;
    },
    canOn(ability: AnyMongoAbility, action, subjectType, record) {
      return ability.can(action, caslSubject(subjectType, recordAttributes(record)));
    },
  };
}
