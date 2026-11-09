# Plan — FE-28

[Spec](spec.md) · [FE-28](../../documents/p4/frontend/fe-28.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/admin/collections`
- `POST /api/admin/collections`
- `GET /api/admin/collections/{id}`
- `PATCH /api/admin/collections/{id}`
- `GET /api/admin/banners`
- `POST /api/admin/banners`
- `GET /api/admin/banners/{id}`
- `PATCH /api/admin/banners/{id}`
- `GET /api/admin/navigation/{placement}`
- `PATCH /api/admin/navigation/{placement}`
- `GET /api/admin/home-layout`
- `PATCH /api/admin/home-layout`

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
| `GET /api/admin/collections` | `content:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=key/active/createdAt`, `sortOrder=asc/desc`, `q`, `active=false/true` | `200` `data MerchandisingEntry[] + meta` | 400, 401, 403, 429 |
| `POST /api/admin/collections` | `content:write` · Task sở hữu | body `key*`, `active*`, `title*`, `productIds*` | `200` `data MerchandisingEntry` | 400, 401, 403, 409, 429 |
| `GET /api/admin/collections/{id}` | `content:read` · Task sở hữu | path `id*` | `200` `data MerchandisingEntry` | 401, 403, 404, 429 |
| `PATCH /api/admin/collections/{id}` | `content:write` · Task sở hữu | path `id*`<br>body `key*`, `active*`, `expectedVersion*`, `title*`, `productIds*` | `200` `data MerchandisingEntry` | 400, 401, 403, 404, 409, 429 |
| `GET /api/admin/banners` | `content:read` · Dùng từ [FE-56](../../documents/p4/frontend/fe-56.md) | query `page`, `pageSize 1–100`, `sortBy=key/active/createdAt`, `sortOrder=asc/desc`, `q`, `active=false/true` | `200` `data MerchandisingEntry[] + meta` | 400, 401, 403, 429 |
| `POST /api/admin/banners` | `content:write` · Dùng từ [FE-56](../../documents/p4/frontend/fe-56.md) | body `key*`, `active*`, `title*`, `imageFileId*`, `href*`, `placement*` | `200` `data MerchandisingEntry` | 400, 401, 403, 409, 429 |
| `GET /api/admin/banners/{id}` | `content:read` · Dùng từ [FE-56](../../documents/p4/frontend/fe-56.md) | path `id*` | `200` `data MerchandisingEntry` | 401, 403, 404, 429 |
| `PATCH /api/admin/banners/{id}` | `content:write` · Dùng từ [FE-56](../../documents/p4/frontend/fe-56.md) | path `id*`<br>body `key*`, `active*`, `expectedVersion*`, `title*`, `imageFileId*`, `href*`, `placement*` | `200` `data MerchandisingEntry` | 400, 401, 403, 404, 409, 429 |
| `GET /api/admin/navigation/{placement}` | `content:read` · Dùng từ [FE-57](../../documents/p4/frontend/fe-57.md) | path `placement*` | `200` `data MerchandisingEntry` | 401, 403, 404, 429 |
| `PATCH /api/admin/navigation/{placement}` | `content:write` · Dùng từ [FE-57](../../documents/p4/frontend/fe-57.md) | path `placement*`<br>body `expectedVersion`, `items*` | `200` `data MerchandisingEntry` | 400, 401, 403, 404, 409, 429 |
| `GET /api/admin/home-layout` | `content:read` · Dùng từ [FE-58](../../documents/p4/frontend/fe-58.md) | — | `200` `data MerchandisingEntry` | 401, 403, 429 |
| `PATCH /api/admin/home-layout` | `content:write` · Dùng từ [FE-58](../../documents/p4/frontend/fe-58.md) | body `expectedVersion`, `sections*` | `200` `data MerchandisingEntry` | 400, 401, 403, 409, 429 |
