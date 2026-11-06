# @p4/api-sdk

SDK TypeScript build sẵn từ OpenAPI của P4; dùng được trong browser và Node.js.
Không import model Sequelize hoặc code server. React là peer tùy chọn.

Tham khảo cách tách shared/browser của TTMS, nhưng P4 sinh contract từ OpenAPI,
không kéo dependency DB vào SDK và giữ TanStack Query hiện có thay vì thêm SWR.

## Sử dụng

```ts
import { createApiSdk, unwrap } from '@p4/api-sdk/shared';

const sdk = createApiSdk({ baseUrl: 'http://127.0.0.1:3001' });
const result = unwrap(await sdk.GET('/api/categories', {
  params: { query: { page: 1, pageSize: 10, sortBy: 'name', sortOrder: 'asc' } },
}));
// result giữ nguyên envelope API: { data, meta, ... }.
```

`baseUrl` là origin API; đường dẫn endpoint đã chứa `/api`. TypeScript kiểm tra
method, path, path params, query, body và response. Types không thay thế validation
runtime ở server.

- `@p4/api-sdk/shared`: `createApiSdk`, `unwrap`, `ApiSdkError`, `getFieldError`,
  cùng `paths`, `operations`, `components` sinh từ OpenAPI.
- `@p4/api-sdk/auth`: `createP4AuthClient('http://127.0.0.1:3001/api')`, client
  Better Auth cho `signIn.email`, `signOut`, `getSession`… Native auth dùng response
  Better Auth, không dùng `unwrap` của envelope nghiệp vụ.
- `@p4/api-sdk/react`: `ApiSdkProvider`, category query/mutation hooks và query options.
  Dùng chung QueryClient do `@p4/api-client` cung cấp, không tạo cache thứ hai.

Cookie gửi kèm mặc định (`credentials: 'include'`). Bearer token có thể truyền qua
`getToken`; locale/header động qua `getHeaders`, được đọc lại mỗi request. Khi dùng
SSR, tự forward cookie của đúng request và Origin hợp lệ cho mutation dùng cookie;
không dùng singleton lưu token giữa các người dùng.

Có thể truyền `signal: AbortSignal`, custom `fetch`, `onUnauthorized` và
`credentials` vào client/request. SDK không tự retry mutation. Với API hỗ trợ
idempotency, caller giữ cùng `Idempotency-Key` khi chủ động retry một thao tác.

`unwrap` ném `ApiSdkError` cho HTTP lỗi; `getFieldError(error, 'slug')` lấy lỗi field.
Network/abort errors giữ nguyên. Endpoint binary hoặc không có body dùng response
trực tiếp và `parseAs` phù hợp thay vì `unwrap`.

## Cập nhật contract và build

Chạy từ root monorepo:

```sh
pnpm --filter @p4/api openapi:generate
pnpm --filter @p4/api-sdk generate
pnpm --filter @p4/api-sdk test
pnpm --filter @p4/api-sdk build
```

Nguồn contract là `apps/api/openapi.yaml`; không sửa `src/shared/generated.ts` bằng
tay. Build kiểm tra contract đã đồng bộ, xuất JavaScript ESM và declaration vào
`dist/`. Điều kiện `development` dùng source trong workspace; consumer thông thường
nhận file build. Package hiện private trong workspace, chưa publish npm.

## React hooks

`ApiQueryProvider` của P4 đã gắn `ApiSdkProvider`. App khác có thể tự bọc
`QueryClientProvider` và `ApiSdkProvider sdk={sdk}`.

```tsx
import { useCategories, useCreateCategory } from '@p4/api-sdk/react';

function CategoryList() {
  const query = useCategories({ page: 1, pageSize: 10, q: 'shirt' });
  const create = useCreateCategory();
  // query.data / isPending / error / refetch
  // create.mutate({ name: 'Clothing', slug: 'clothing' })
  return <span>{query.data?.data.length ?? 0}</span>;
}
```

Có sẵn `useCategories`, `useCategory(id)`, `useCreateCategory`, `useUpdateCategory`,
`useDeleteCategory`. Mutation thành công invalidate các list/detail category;
thất bại giữ cache và lỗi theo field, không tự retry. `mutate`/`mutateAsync` hỗ trợ
callbacks của TanStack Query. Query truyền AbortSignal xuống request.
`categoryKeys`, `categoryQueryOptions(sdk)` và `categoryMutationOptions(sdk, queryClient)`
dùng được cho prefetch/cache invalidation và cấu hình TanStack nâng cao. Core
`createCategoryApi(sdk)` dùng được ngoài React; caller không cần gọi `unwrap`.

Category là resource đầu tiên có hook nghiệp vụ. Các API còn lại đã có typed client,
chưa có named hooks; bổ sung theo resource khi ghép màn tương ứng.
