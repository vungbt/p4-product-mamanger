# `@p4/api-client`

HTTP client + TanStack Query cho P4 — pattern tham khảo [smart-connection-monorepo/libs/api-client](https://github.com/vungbt/smart-connection-monorepo/tree/develop/libs/api-client).

## Cài trong web

```tsx
import { ApiQueryProvider, axiosClient, useApiQuery, productKeys } from '@p4/api-client';
import type { ApiPaginatedSuccess, Product } from '@p4/shared';

// app.tsx
<ApiQueryProvider enableDevtools={import.meta.env.DEV}>
  ...
</ApiQueryProvider>

// hook / page
const { data, isLoading } = useApiQuery<ApiPaginatedSuccess<Product>>({
  endpoint: '/products',
  params: { page: 1, pageSize: 20 },
  queryKey: productKeys.list({ page: 1, pageSize: 20 }),
  headerConf: { authorization: false }, // public
});
```

## API

| Export | Mô tả |
|--------|--------|
| `axiosClient` | get/post/put/patch/delete — interceptor trả envelope `{ data, meta }` |
| `useApiQuery` / `useApiMutation` | wrapper TanStack Query |
| `queryKeysFactory` / `productKeys`… | factory queryKey |
| `ApiQueryProvider` | QueryClientProvider + optional Devtools |
| `getAccessToken` | đọc token từ `@p4/auth` storage |

- Base URL: gọi `configureApiClient({ baseURL })` từ web (`API_BASE_URL`)
- `Authorization` + `Accept-Language` (từ `p4_locale`)
- 401 → `POST /auth/refresh` một lần rồi retry
