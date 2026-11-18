# @p4/ability

CASL authorization shared by the APIs and webs: a generic engine plus one definition (kit) per app.

- `@p4/ability/core` (no React): `createAbilityKit(definition)`, `ANY_ACTION`, `ANY_SUBJECT` and the generic types (`KitAbility`, `KitRule`, `KitBuilder`, `AbilityKit`, `ClientAbilityKit`).
- `@p4/ability/shared` (no React): the P4 kit (`p4AbilityKit`) and its exports: actions, subjects, `AppAbility`, `defineAbilityFor(user)`, `createAppAbility(rules)`, `rulesForStaffRole(role)`, `canAccess` and `canOn`.
- `@p4/ability/browser`: `createAbilityReact(kit)` for any kit (`useCanAccess`, `useCanAccessSome`, `useCanOn`…), and the P4 bindings `AbilityProvider`, `useAbility`, `useCanAccess`, `useCanOn` and a typed `<Can>`.

## Defining a kit for a new app

Keep the app's definition in the app or its own lib (not in this package). Import only `@p4/ability/core` on the server, and `@p4/ability/browser` on the web.

```ts
import { ANY_ACTION, ANY_SUBJECT, createAbilityKit } from '@p4/ability/core';

type StayAction = 'read' | 'write' | 'manage';
type StaySubject = 'Building' | 'Room' | 'Invoice';
interface StayUser { id: string; role: 'owner' | 'manager'; buildingIds: string[] }
/** Record attributes the conditions use. */
interface StayRecord { buildingId?: string }

export const stayAbilityKit = createAbilityKit<StayAction, StaySubject, StayUser, StayRecord>({
  actions: ['read', 'write', 'manage'],
  subjects: ['Building', 'Room', 'Invoice'],
  define({ can }, user) {
    if (user.role === 'owner') can(ANY_ACTION, ANY_SUBJECT);
    if (user.role === 'manager') {
      can(['read', 'write'], ['Room', 'Invoice'], { buildingId: { $in: user.buildingIds } });
    }
  },
  // Optional: fields of a record matched by `canOn` (default: a shallow copy of the record).
  recordAttributes: ({ buildingId }) => ({ buildingId }),
});

// Server
const ability = stayAbilityKit.defineAbilityFor(user);
stayAbilityKit.canAccess(ability, 'read', 'Invoice'); // every invoice
stayAbilityKit.canOn(ability, 'write', 'Invoice', invoice); // this invoice
const rules = stayAbilityKit.abilityRules(ability); // send to the client

// Web: mount `AbilityProvider` once at the root with the rules from the API
export const { AbilityProvider, useAbility, useCanAccess, useCanOn, Can } =
  createAbilityReact(stayAbilityKit);
```

The kit returns:

| Member | Use |
|---|---|
| `defineAbilityFor(user)` | Server ability of a signed-in user |
| `createAppAbility(rules?)` | Rebuild from serialized rules; none means no access |
| `abilityRules(ability)` | Serializable rules for clients |
| `rulesFrom(define)` | Rules of a partial definition (e.g. one role, for role listings) |
| `canAccess(ability, action, subject)` | Unconditional access (routes, menus) |
| `canAccessSome(ability, action, subject)` | Access to at least one record, counting conditional rules (areas whose data the API filters per record, e.g. a manager's buildings); `useCanAccessSome` on the web |
| `canOn(ability, action, subject, record)` | Access to one record, honouring conditions |

Conditions are CASL Mongo queries on the record attributes (`{ userId }`, `{ buildingId: { $in: [...] } }`). Do not put secrets in conditions: the rules are sent to the client. CASL's React context is shared, so a page mounts the provider of one kit only. Translating rules into SQL `where` clauses is not part of this package yet.

## P4 model

Rules are `action` + `subject`, created with `anyAction: '*'` and `anySubjectType: 'all'`, so `manage` is an ordinary action rather than CASL's wildcard.

- **Staff** (`role: 'admin'`): one definition per `staffRole` in `src/shared/builder.ts`. A missing staff role means `owner`.
- **Every signed-in user**: owner rules with `{ userId: user.id }` on `Order`, `Payment`, `Return`, `Refund`, `Support` and `Review`.

## Checks

| Need | API (`@/middlewares/ability.middleware.js`) | Web |
|---|---|---|
| Route, menu, toolbar (all records) | `requireAbility(action, subject)`, `hasAccess`, `assertAccess` | route `ability`, `useCanAccess` |
| One owned record | `canAccessRecord`, `assertCanAccessRecord` | `useCanOn` |

`canAccess` ignores conditional rules: a customer who can read their own orders is not given the order admin. CASL's own `ability.can('read', 'Order')` and `<Can I="read" a="Order">` would pass for that customer, so use them only with a record (`this={record}`).

The API sends the current user's rules from `GET /api/me/capabilities`. The web mounts `CapabilityAbilityProvider` (`apps/web/src/libraries`) once at the root.

## Changing P4 rules

1. Add the action or subject to `AbilityAction` / `AbilitySubject` in `@p4/shared` and to `src/shared/actions.ts`.
2. Update the role definitions in `src/shared/builder.ts` and `tests/ability.test.mjs`.
3. Guard routes with `requireAbility`, then regenerate OpenAPI and `@p4/api-sdk`.

Build with `pnpm --filter @p4/ability build`; test with `pnpm --filter @p4/ability test`.
