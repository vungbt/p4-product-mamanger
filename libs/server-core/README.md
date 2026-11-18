# @p4/server-core

Server infrastructure shared by the Express + Sequelize + Better Auth APIs in this monorepo (`apps/api`, and later `apps/stay/api`). The package never imports an app's models or `sequelize` instance: anything that touches the database is a factory that receives them.

- `@p4/server-core`: everything below (Node, Express, Sequelize, Better Auth).
- `@p4/server-core/shared`: helpers without runtime state: errors, `selectFields`, `ModelOrder` / `StringField`, `jsonValue`, `redact`, pagination.

Build with `pnpm --filter @p4/server-core build` (the API's `prebuild`/`predev` do this); test with `pnpm --filter @p4/server-core test`. Type-checking consumers read `src` directly, Node loads `dist`.

## Modules

| Module | Exports | Notes |
| --- | --- | --- |
| Errors (`shared/errors.ts`) | `BaseError`, `BadRequest`, `InputValidError`, `Unauthorized`, `Forbidden`, `NotFound`, `isAppError` | Rendered by `handleErrorApi` as `{ message, code, extensions? }`. Messages are i18n keys from the app's `error` namespace. |
| DTO (`shared/select-fields.ts`, `shared/database.ts`) | `selectFields`, `ModelOrder`, `StringField`, `SortDirection` | Typed field selection and simple Sequelize ordering/search fields. |
| JSON (`shared/json.ts`, `shared/redact.ts`) | `jsonValue`, `redact` | Canonical JSON for fingerprints/JSONB; recursive redaction of private keys. |
| Request context (`request-store.ts`) | `requestStore`, `RequestContext` | `AsyncLocalStorage` with request id, user, audit policy and source. |
| Express types (`express.ts`) | `JsonApiBody` | Declares `req.user` (`Express.User`), `req.requestId`, `res.jsonApi`; loads i18next's `req.t`. |
| HTTP (`http/*`) | `requestContext`, `baseMiddleware`, `handleErrorApi`, `notFoundHandler`, `createApiHandlers`, `requestBody`, `currentUser`, `routeId`, `uuidRouteId`, `validate` | `{ data, meta? }` envelope, field errors, validatorjs body/query validation. |
| List query (`list/*`) | `validateListQuery`, `queryText`, `queryNumber`, `dateFilters`, `uuidQueryRule`, `dateQueryRule`, `ListLocals`, `searchPattern`, `numberRange`, `dateRange`, `listSearch` | Standard `page/pageSize/q/sortBy/sortOrder` with an allowlist; unknown parameters are rejected. |
| Audit (`audit/*`) | `createAuditRuntime`, `setAuditChanges`, `applyAuditPolicies`, `AUDIT_ACTIONS`, `auditScope` | Audited transactions and audit rows; every route needs an explicit policy. |
| Outbox and idempotency (`persistence/*`) | `createOutbox`, `createIdempotency` | `enqueueEvent` in the business transaction; `runIdempotent` with an advisory lock and stored replay. |
| Auth (`auth/better-auth.ts`, `middleware/auth.ts`, `middleware/cookie-origin.ts`) | `createBetterAuth`, `AUTH_AUDIT_ACTIONS`, `createAuthRequired`, `requireRole`, `createCookieOriginGuard` | Better Auth sessions, bearer tokens and audit of auth actions; CSRF origin check for cookie writes. |
| Rate limit (`middleware/rate-limit.ts`) | `createRateLimit` | Fixed window in the `rate_limit_buckets` table. |
| Production config (`config/production.ts`) | `assertSecret`, `assertHttpsAuthUrl`, `assertExplicitCors`, `assertHttpsMailTransport`, `createBlockedPasswordCheck` | Fail fast on placeholder secrets, plain HTTP and wildcard CORS. |
| Logging (`logger.ts`) | `logger` | Prefixed console logger; `debug` is silent in production. |

| Authorization (`middleware/ability.ts`) | `createAbilityGuards` | `requireAbility`, `hasAccess`, `assertAccess`, `canAccessRecord`, `assertCanAccessRecord` for one app's `@p4/ability` kit. |

The rules themselves live with the app's kit (`@p4/ability/core`). Bind the guards once in the app:

```ts
export const { abilityOf, requireAbility, hasAccess, canAccessRecord, assertCanAccessRecord } =
  createAbilityGuards(stayAbilityKit, { getUser: (req) => req.user });

router.get('/rooms', authRequired, requireAbility('read', 'Room'), listHandler(listRooms));
assertCanAccessRecord(user, 'update', 'Room', { buildingId: room.buildingId });
```

`requireAbility` carries `requiredAbility` (`action:Subject`), which the OpenAPI generator documents. P4 keeps its own `apps/api/src/middlewares/ability.middleware.ts`.

`createBetterAuth` also accepts `disableSignUp`, `defaultRole` (for social sign-in) and `google.disableImplicitSignUp`; P4 uses the defaults.

## Database tables

The factories assume the same tables and columns as P4's migrations (`apps/api/src/sequelize/migrations`): `audit_logs`, `domain_events`, `idempotency_records`, `rate_limit_buckets`, and Better Auth's `users`, `auth_accounts`, `auth_sessions`, `auth_verifications` with snake_case columns (`users.role`, `users.account_status`). Copy those migrations when starting a new app.

## Configuring a new app

Create the bindings once, in the files the app's modules import (P4 uses `src/shared/audit/audited-command.ts`, `src/shared/api-handler.ts`, `src/shared/commerce/persistence.ts`, `src/configs/better-auth.ts` and `src/middlewares/*`).

```ts
// Express.User: add the app's user fields to req.user (src/types/express.d.ts)
import type { User as AppUser } from '@stay/shared';
declare global {
  namespace Express {
    interface User extends AppUser {}
  }
}
```

```ts
import {
  createApiHandlers,
  createAuditRuntime,
  createAuthRequired,
  createBetterAuth,
  createBlockedPasswordCheck,
  createCookieOriginGuard,
  createIdempotency,
  createOutbox,
  createRateLimit,
} from '@p4/server-core';

// Audit
export const { auditedTransaction, auditedCommand, inTransaction, recordAudit } =
  createAuditRuntime({
    sequelize,
    writeAuditLog: (row, transaction) => AuditLogModel.create(row, { transaction }),
  });

// Route handlers: keep these exact names, the OpenAPI generator looks for them.
export const { apiHandler, listHandler, optionalListHandler } =
  createApiHandlers(auditedTransaction);

// Outbox and idempotency
export const { enqueueEvent } = createOutbox({
  insertEvent: (row, transaction) => DomainEventModel.create(row, { transaction }),
});
export const { runIdempotent } = createIdempotency({
  sequelize,
  auditedTransaction,
  ttlHours: 24,
  records: {
    findLocked: (options) => IdempotencyRecordModel.findOne(options),
    create: (row, transaction) => IdempotencyRecordModel.create(row, { transaction }),
  },
});

// Better Auth: a dedicated pg pool, closed on shutdown.
export const auth = createBetterAuth({
  appName: 'Stay',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://127.0.0.1:3011',
  secret: process.env.BETTER_AUTH_SECRET ?? '',
  pool: authPool,
  trustedOrigins: ['http://localhost:5174'],
  isProd,
  cookiePrefix: 'stay', // only when apps share a cookie domain
  isBlockedPassword: createBlockedPasswordCheck(isProd),
  sendAuthEmail: (request) => queueAuthEmail(request), // e.g. through enqueueEvent
  loadUser: async (id) => {
    const user = await UserModel.findByPk(id);
    return user ? { id: user.id, email: user.email, role: user.role } : null;
  },
  audit: { auditedTransaction, recordAudit },
});

// Middleware
export const assertCookieOrigin = createCookieOriginGuard(() => allowedWebOrigins);
export const authRequired = createAuthRequired({
  resolveUser: async (req) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    return session ? loadActiveUser(session.user.id) : undefined;
  },
  assertRequest: assertCookieOrigin,
});
export const rateLimit = createRateLimit(sequelize);
```

Mount order in `createApp()`:

```ts
app.use(requestContext);
app.use(i18nMiddleware); // i18next-http-middleware with `error`, `validator` namespaces
app.all('/api/auth/*', toNodeHandler(auth));
app.use(express.json({ limit: '1mb' }));
app.use('/api', baseMiddleware, apiRouter);
app.use(notFoundHandler);
app.use(handleErrorApi);
```

Every router ends with `applyAuditPolicies(router, policies)`, one explicit `AuditAction` per `METHOD /path`. Call `assertSecret` / `assertHttpsAuthUrl` / `assertExplicitCors` from the app's startup when `NODE_ENV=production`.

New audit actions are added to `AUDIT_ACTIONS` in `src/audit/types.ts` (with `changesData`), since the action list is part of the shared contract.
