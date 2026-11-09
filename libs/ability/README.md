# @p4/ability

CASL authorization shared by the API and web.

- `@p4/ability/shared` (no React): actions, subjects, `AppAbility`, `defineAbilityFor(user)`, `createAppAbility(rules)`, `rulesForStaffRole(role)`, `canAccess` and `canOn`.
- `@p4/ability/browser`: `AbilityProvider`, `useAbility`, `useCanAccess`, `useCanOn` and a typed `<Can>`.

## Model

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

## Changing rules

1. Add the action or subject to `AbilityAction` / `AbilitySubject` in `@p4/shared` and to `src/shared/actions.ts`.
2. Update the role definitions in `src/shared/builder.ts` and `tests/ability.test.mjs`.
3. Guard routes with `requireAbility`, then regenerate OpenAPI and `@p4/api-sdk`.

Build with `pnpm --filter @p4/ability build`; test with `pnpm --filter @p4/ability test`.
