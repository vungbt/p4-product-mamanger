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

Kiểm chứng filter/sort/paging bằng API local thật (chỉ đọc seed categories):

```sh
P4_TEST_API_URL=http://127.0.0.1:3001 pnpm --filter @p4/api-sdk test:local
```

## Hooks cho toàn bộ API

Ngoài hooks categories/capabilities hiện có, SDK sinh helper và React Query hook
cho **mọi operation trong OpenAPI**, bao gồm admin, storefront, tài khoản,
đơn hàng, thanh toán, kho, CMS, báo cáo, process và file.

Tên lấy từ `operationId`, bỏ đoạn `_api_` và chuyển sang camelCase:
`get_api_admin_products` → `getAdminProducts` / `useGetAdminProducts`.
Tra đầy đủ method/path/tên helper trong `src/shared/operations.json`.
Mỗi GET có `…QueryOptions`; mỗi method còn lại có `…MutationOptions`.
Input lấy trực tiếp từ method tương ứng trong generated contract, giữ nguyên
`params.path`, `params.query`, `params.header`, `body`, `headers` và `signal`.
POST và PUT có kiểu riêng; SDK không tự chèn field hay chuyển đổi số tiền.

```tsx
import { useGetAdminProducts, usePutProductsId } from '@p4/api-sdk/react';

function Products() {
  const query = useGetAdminProducts({
    params: { query: { page: 1, pageSize: 10, sortBy: 'stock', sortOrder: 'desc' } },
  });
  const update = usePutProductsId();
  // Trong event handler: chỉ gửi field cần sửa, giữ version snapshot server.
  const rename = (id: string, version: number) => update.mutate({
    params: { path: { id } },
    body: { name: 'Tên mới', expectedVersion: version },
  });
  return <button onClick={() => rename('product-id', 1)}>{query.data?.meta.total}</button>;
}
```

Server vẫn là nguồn quyết định validation và transition. Ví dụ PUT product
không cho sửa `stock` dù field còn có trong OpenAPI; dùng operation inventory
để đổi tồn. SDK giữ `ApiSdkError.code`/`fieldErrors` để UI phân biệt conflict,
lỗi điều kiện nghiệp vụ và lỗi field. Không retry mutation tự động; với API
cần idempotency, caller cung cấp và giữ cùng key khi chủ động thử lại.

Các query key sinh có dạng `['api', operationId, params]`, tách admin/storefront,
path, filter, sort và page. Query nhận settings như `enabled`, `staleTime`,
`retry`, `queryKey`; `signal` do React Query cung cấp được truyền xuống fetch.
Không đặt token trong query key. Khi response phụ thuộc tenant/locale qua header,
caller cần truyền `queryKey` có scope tương ứng. QueryClient phải được clear khi
đổi phiên/tài khoản, như các resource hook hiện có.

Mutation thành công mặc định invalidate các GET key thuộc resource đó (xem
`resourceInvalidationKeys`): products gồm list/detail/variants admin và storefront;
categories gồm cả generated keys và `categoryKeys.all`; size-guides có nhóm riêng.
Các resource khác dùng `x-resource`/tag OpenAPI. Có thể thay thế qua
`{ invalidate: [key] }`, hoặc `{ invalidate: [] }` khi tự đồng bộ cache. Caller cần
thêm key cho dữ liệu phụ thuộc resource khác hoặc `queryKey` tùy chỉnh, kể cả
`['capabilities']` khi thay đổi quyền. Mutation lỗi giữ cache cũ.

GET download trả `Blob`, response HTML trả `string`, operation không có body
trả `undefined`; các response JSON giữ nguyên envelope của API. Multipart import
nhận `FormData` với field `file`; để fetch tự đặt boundary, không tự đặt header
`Content-Type`. Các API nội bộ/webhook/callback cũng có helper theo contract;
việc có helper không cấp quyền gọi hay thay thế luồng xác thực/provider tương ứng.
Dùng client Better Auth tại `@p4/api-sdk/auth` cho luồng đăng nhập ứng dụng.

`pnpm --filter @p4/api-sdk generate` sinh cả types, helpers, hooks và manifest.
Build/test kiểm tra tất cả đều khớp OpenAPI; không sửa các file generated bằng tay.

### Resource products

Các hooks tên ngắn cho luồng sản phẩm được cung cấp thêm, dùng cùng helper
và query key với các operation sinh:

- Admin: `useProducts(query)`, `useProduct(id)`, `useProductVariants(id)`.
- Storefront: `useStorefrontProducts(query)`, `useStorefrontProduct(id)`,
  `useProductBySlug(slug)`.
- Sản phẩm: `useCreateProduct()`, `useUpdateProduct()`, `useDeleteProduct()`,
  `useUpdateProductPublication()`.
- SKU/gallery: `useCreateProductVariant()`, `useUpdateProductVariant()`,
  `useUpdateProductVariantImages()`, `useAddProductImage()`, `useRemoveProductImage()`.

`createProductApi(sdk)` dùng độc lập với React; `productQueryOptions(sdk)` và
`productMutationOptions(sdk, queryClient)` dùng prefetch hoặc MutationObserver.
`ProductInput` và `ProductUpdateInput` tách riêng. Resource update chủ động cấm
`stock` ở type để phản ánh service thực tế; helper PUT sinh vẫn giữ nguyên schema
OpenAPI. Ảnh truyền storage ID đã verify, không truyền URL. Publication và sửa SKU
nhận `expectedVersion` từ snapshot, không mặc định thành 1.

List và detail product cùng trả đầy đủ metadata catalog: slug, status, version,
thương hiệu, chất liệu, SEO, category, ảnh đại diện và gallery. Hook không tự điền
draft hoặc ép kiểu che field thiếu.
`productKeys.all` là namespace chung `['api']` cho thao tác cache thủ công; mutation
mặc định chỉ invalidate `resourceInvalidationKeys.products`. `lists()`/`details()`
cho phép invalidate riêng danh sách/chi tiết admin. PATCH nhận `imageStorageIds`
để thay toàn bộ gallery theo thứ tự trong cùng transaction cập nhật; bỏ qua trường để giữ nguyên.

Tra [API/hook theo platform](../../documents/backend/api-sdk-reference.md) và [workflow upload đơn/batch](../../documents/backend/uploads.md). Scalar `/api/docs` hiển thị cùng tên export và ví dụ theo từng operation.

### Ticket uploads

`createUploadApi(sdk, { baseUrl, xhr? })` from `@p4/api-sdk/shared` uploads files
without React. `baseUrl` resolves relative signed provider URLs; `sdk.baseUrl`
contains the origin configured on the client. API calls use the SDK's authenticated
fetch. File transfers use XHR with `withCredentials: false`, multipart field `file`,
a 120-second timeout, and optional `onProgress(percent)` / `signal`.

```ts
import { createUploadApi, type UploadSession } from '@p4/api-sdk/shared';

const uploads = createUploadApi(sdk, { baseUrl: sdk.baseUrl });
const session: UploadSession = {
  sent: false, attempted: false, controller: new AbortController(),
};
const result = await uploads.uploadFile({
  file, purpose: 'product', resourceId: productId, session,
  onProgress: (percent) => console.log(percent),
});
// result: { storageId, fileId, ticketId }; returned only after server verification.
```

Retain the same session when retrying the same file. It reuses the ticket, skips
successful transfers, and verifies ambiguous provider responses before resending.
API failures retain `ApiSdkError`; validation and provider failures are Errors.

`uploads.uploadFiles(files, { purpose, resourceId?, signal?, onProgress?,
idempotencyKey? })` uses the batch ticket and batch completion endpoints for 1–20
files. Progress receives `(index, percent)`. It returns `{ files, process }`, with
per-file settled transfer outcomes and the asynchronous verification process (or
`null` when no transfers succeeded). Track that process before attaching files;
a successful provider transfer alone does not imply verification. The optional
idempotency key is forwarded to batch completion. `uploads.verifyBatch(batch, { signal? })`
waits for a terminal process and returns settled verified outcomes in input order.

`useTicketUpload({ purpose, resourceId?, mode?: 'single' | 'batch', failureMessage })` from
`@p4/api-sdk/react` uses the existing `ApiSdkProvider`. It exposes `items`, `add`,
`remove`, `retry(item)`, `clear`, `busy`, and verified `results`. Each item retains
its retry session; removing/clearing items or unmounting aborts work and revokes
preview object URLs.

Upload mode defaults to `single`: one ticket and completion per file. In `batch`
mode each nonempty `add(files)` uses one batch ticket and completion (1–20 files),
even for one file; provider POSTs run in parallel with per-file progress. Results
become attachable only after process verification. Retries always use the single
flow with the retained ticket. The product form explicitly selects `batch`.

The admin form edits one ordered image list: its first entry becomes
`thumbnailStorageId`, and the rest become `imageStorageIds`. Uploads start on pick;
remove/reorder changes remain local until Save sends one PATCH.
On update, `imageStorageIds` replaces the complete ordered gallery; omission
preserves it and `[]` detaches every gallery image. `thumbnailStorageId: null`
clears the thumbnail; omission preserves it. Either field can reuse storage IDs
already attached to this product without upload tickets. New files require a
completed actor-owned product upload. The thumbnail is excluded from the gallery.
List/detail `thumbnailUrl` falls back to the first gallery image (or an empty
string); `thumbnail` is `{ fileId, url, storageId } | null`, and gallery entries
include `storageId`. The legacy `addImage({ storageId })` and `removeImage`
commands remain available for individual gallery operations.
Avatar updates take `avatarStorageId`. Cart, quote, order and banner DTOs use
`thumbnailUrl`; content uses `thumbnailFileId` and `images`, review images use `imageIds`.
