# Plan — FE-26

[Spec](spec.md) · [FE-26](../../documents/p4/frontend/fe-26.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/admin/posts`
- `POST /api/admin/posts`
- `GET /api/admin/posts/{id}`
- `PATCH /api/admin/posts/{id}`
- `POST /api/admin/posts/{id}/publish`
- `POST /api/admin/posts/{id}/archive`
- `GET /api/admin/posts/{id}/revisions`
- `GET /api/admin/pages`
- `POST /api/admin/pages`
- `GET /api/admin/pages/{id}`
- `PATCH /api/admin/pages/{id}`
- `POST /api/admin/pages/{id}/publish`
- `POST /api/admin/pages/{id}/archive`
- `GET /api/admin/pages/{id}/revisions`
- `GET /api/post-categories`
- `POST /api/admin/post-categories`
- `PATCH /api/admin/post-categories/{id}`
- `GET /api/post-tags`
- `POST /api/admin/post-tags`
- `PATCH /api/admin/post-tags/{id}`

Types request/response lấy từ contract sinh trong `@p4/api-sdk/shared`; enum/state nghiệp vụ dùng `@p4/shared`, `@p4/processes/shared`, `@p4/realtime/shared`. Không định nghĩa trùng hoặc ép type để lách schema.

## Tổ chức và kiểm chứng

- API client, query keys và resource query/mutation hooks nằm trong `libs/api-sdk`; component gọi hook trực tiếp. Hook feature chỉ xử lý state/handler màn hình, không tạo service hoặc hook chuyển tiếp. Props dùng ở đâu định nghĩa ở đó.
- Dùng component/icon/token của `@itclabs/react-ui`, tái sử dụng `libs/blocks`; không dựng lại UI primitives hoặc thêm wrapper/view chỉ để chuyển props.
- Áp dụng [quy ước UI và API](../../documents/p4/frontend/README.md#quy-ước-nghiệm-thu-chung), có loading/empty/error/retry; lỗi field vào field, lỗi chung hiển thị tại form.
- Chạy typecheck/lint/build phù hợp và thao tác luồng thật qua API local. Ghi endpoint, tình huống, kết quả trong phần dưới; không coi mock data là nghiệm thu API.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `GET /api/admin/posts` | `content:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=title/createdAt`, `sortOrder=asc/desc`, `q`, `taxonomyId`, `status=archived/draft/published/scheduled` | `200` `data ContentEntry[] + meta` | 400, 401, 403, 429 |
| `POST /api/admin/posts` | `content:write` · Task sở hữu | body `body*`, `slug*`, `title*`, `excerpt`, `coverFileId`, `taxonomyIds`, `seoTitle`, `seoDescription` | `201` `data ContentEntry` | 400, 401, 403, 409, 429 |
| `GET /api/admin/posts/{id}` | `content:read` · Task sở hữu | path `id*` | `200` `data ContentEntry` | 401, 403, 404, 429 |
| `POST /api/admin/posts/{id}/publish` | `content:publish` · Task sở hữu | path `id*`<br>body `scheduledAt`, `expectedVersion*` | `200` `data ContentEntry` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/posts/{id}/archive` | `content:publish` · Task sở hữu | path `id*`<br>body `expectedVersion*` | `200` `data ContentEntry` | 400, 401, 403, 404, 409, 429 |
| `PATCH /api/admin/posts/{id}` | `content:write` · Dùng từ [FE-55](../../documents/p4/frontend/fe-55.md) | path `id*`<br>body `body*`, `slug*`, `title*`, `excerpt`, `coverFileId`, `taxonomyIds`, `seoTitle`, `seoDescription`, `expectedVersion*` | `200` `data ContentEntry` | 400, 401, 403, 404, 409, 429 |
| `GET /api/admin/posts/{id}/revisions` | `content:read` · Dùng từ [FE-55](../../documents/p4/frontend/fe-55.md) | path `id*`<br>query `page`, `pageSize 1–100`, `sortBy=version/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { id, version, snapshot, createdAt }[] + meta` | 400, 401, 403, 404, 429 |
| `GET /api/admin/pages` | `content:read` · Dùng từ [FE-53](../../documents/p4/frontend/fe-53.md) | query `page`, `pageSize 1–100`, `sortBy=title/createdAt`, `sortOrder=asc/desc`, `q`, `taxonomyId`, `status=archived/draft/published/scheduled` | `200` `data ContentEntry[] + meta` | 400, 401, 403, 429 |
| `POST /api/admin/pages` | `content:write` · Dùng từ [FE-53](../../documents/p4/frontend/fe-53.md) | body `body*`, `slug*`, `title*`, `excerpt`, `coverFileId`, `taxonomyIds`, `seoTitle`, `seoDescription` | `201` `data ContentEntry` | 400, 401, 403, 409, 429 |
| `GET /api/admin/pages/{id}` | `content:read` · Dùng từ [FE-53](../../documents/p4/frontend/fe-53.md) | path `id*` | `200` `data ContentEntry` | 401, 403, 404, 429 |
| `PATCH /api/admin/pages/{id}` | `content:write` · Dùng từ [FE-53](../../documents/p4/frontend/fe-53.md) | path `id*`<br>body `body*`, `slug*`, `title*`, `excerpt`, `coverFileId`, `taxonomyIds`, `seoTitle`, `seoDescription`, `expectedVersion*` | `200` `data ContentEntry` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/pages/{id}/publish` | `content:publish` · Dùng từ [FE-53](../../documents/p4/frontend/fe-53.md) | path `id*`<br>body `scheduledAt`, `expectedVersion*` | `200` `data ContentEntry` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/pages/{id}/archive` | `content:publish` · Dùng từ [FE-53](../../documents/p4/frontend/fe-53.md) | path `id*`<br>body `expectedVersion*` | `200` `data ContentEntry` | 400, 401, 403, 404, 409, 429 |
| `GET /api/admin/pages/{id}/revisions` | `content:read` · Dùng từ [FE-55](../../documents/p4/frontend/fe-55.md) | path `id*`<br>query `page`, `pageSize 1–100`, `sortBy=version/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { id, version, snapshot, createdAt }[] + meta` | 400, 401, 403, 404, 429 |
| `GET /api/post-categories` | Công khai · Dùng từ [FE-54](../../documents/p4/frontend/fe-54.md) | query `page`, `pageSize 1–100`, `sortBy=name/slug/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { id, slug, name }[] + meta` | 400, 429 |
| `POST /api/admin/post-categories` | `content:write` · Dùng từ [FE-54](../../documents/p4/frontend/fe-54.md) | body `name*`, `slug*` | `201` `data { id, slug, name }` | 400, 401, 403, 409, 429 |
| `PATCH /api/admin/post-categories/{id}` | `content:write` · Dùng từ [FE-54](../../documents/p4/frontend/fe-54.md) | path `id*`<br>body `name*`, `slug*` | `200` `data { id, slug, name }` | 400, 401, 403, 404, 409, 429 |
| `GET /api/post-tags` | Công khai · Dùng từ [FE-54](../../documents/p4/frontend/fe-54.md) | query `page`, `pageSize 1–100`, `sortBy=name/slug/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { id, slug, name }[] + meta` | 400, 429 |
| `POST /api/admin/post-tags` | `content:write` · Dùng từ [FE-54](../../documents/p4/frontend/fe-54.md) | body `name*`, `slug*` | `201` `data { id, slug, name }` | 400, 401, 403, 409, 429 |
| `PATCH /api/admin/post-tags/{id}` | `content:write` · Dùng từ [FE-54](../../documents/p4/frontend/fe-54.md) | path `id*`<br>body `name*`, `slug*` | `200` `data { id, slug, name }` | 400, 401, 403, 404, 409, 429 |
