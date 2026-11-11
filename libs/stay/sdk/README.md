# @stay/sdk

Typed client for `@stay/api`, generated from `apps/stay/api/openapi.yaml`. Same layout as `@p4/api-sdk`; no server code, React optional.

- `@stay/sdk/shared`: `createStaySdk({ baseUrl })` (openapi-fetch, cookies included), `unwrap`, `ApiSdkError`, `getFieldError`, `getErrorMessage`, and the generated `paths` / `components` / `operations`.
- `@stay/sdk/auth`: `createStayAuthClient('http://127.0.0.1:3011/api')`, the Better Auth client (`signIn.email`, `signOut`, `getSession`…). Native auth returns Better Auth responses, not the `{ data }` envelope.
- `@stay/sdk/portal`: tenant portal (ST-25) client without React: `createPortalSdk({ baseUrl })` (only the HttpOnly portal cookie, never a staff token), `createPortalApi` (`lookup`, `signIn`, `signOut`, `me`, `invoices`, `invoice`, `contract`, `usage`, `notices`), `isPortalSessionError`, `isPortalLocked`. React hooks (`PortalSdkProvider`, `usePortalMe`, `usePortalInvoice`…, keys `['stay-portal', …]`) are in `@stay/sdk/react`; the staff link hooks are `usePortalLinks`, `useCreatePortalLink`, `useRevokePortalLink`.
- `@stay/sdk/react`: `StaySdkProvider`, `useStaySdk`, `useMe(accountId)`, `useCapabilities(accountId)` (rules for `stayAbilityKit` of `@stay/shared`).

```ts
import { createStaySdk, unwrap } from '@stay/sdk/shared';

const sdk = createStaySdk({ baseUrl: 'http://127.0.0.1:3011' });
const { data } = unwrap(await sdk.GET('/api/me/capabilities', {}));
```

## Updating the contract

```sh
pnpm --filter @stay/api openapi:generate   # needs the migrated p4_stay database
pnpm --filter @stay/sdk generate
pnpm --filter @stay/sdk test
```

`build` runs `check:generated` first and fails when `src/shared/generated.ts` is stale. Never edit the generated file by hand.
