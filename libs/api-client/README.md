# `@p4/api-client`

Web glue around the typed SDK (`@p4/api-sdk`): the Better Auth session, the shared TanStack `QueryClient` and query-key helpers. There is no hand-written HTTP client; every request goes through the SDK generated from `apps/api/openapi.yaml`.

## Setup in the web app

```tsx
import { ApiQueryProvider, configureApiClient } from '@p4/api-client';

configureApiClient({ baseURL: API_BASE_URL });

<ApiQueryProvider enableDevtools={import.meta.env.DEV}>{children}</ApiQueryProvider>;
```

## Calling the API

```ts
import { getApiSdk, productKeys, useQuery } from '@p4/api-client';
import { unwrap } from '@p4/api-sdk/shared';

const products = useQuery({
  queryKey: productKeys.list({ page: 1, pageSize: 20 }),
  queryFn: async ({ signal }) =>
    unwrap(await getApiSdk().GET('/api/products', { params: { query: { page: 1, pageSize: 20 } }, signal })),
});

unwrap(await getApiSdk().PATCH('/api/auth/password', { body }));
```

Paths, params, bodies and responses are typed from the contract. `unwrap` throws `ApiSdkError` (status, code, field errors) for non-2xx responses.

## Exports

| Export | Purpose |
|--------|---------|
| `getApiSdk` | Typed SDK client (cookies, bearer token, `Accept-Language` from `p4_locale`) |
| `loginAuthSession`, `loginGoogleAuthSession`, `refreshAuthSession`, `revokeAuthSession` | Better Auth session helpers for `AuthProvider` |
| `ApiQueryProvider` | `QueryClientProvider` + SDK context; clears the cache when the user changes |
| `queryKeysFactory`, `productKeys`, `orderKeys`, `categoryKeys` | Query-key factories |
| `useUploadFile` | Signs an upload with the API, then posts the file to Cloudinary |

A 401 from the SDK re-syncs the session; an expired session signs the user out in `AuthProvider`.
