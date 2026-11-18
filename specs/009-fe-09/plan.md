# Plan — FE-09

[Spec](spec.md) · [FE-09](../../documents/p4/frontend/fe-09.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/me/profile`
- `PATCH /api/me/profile`
- `GET /api/me/preferences`
- `PATCH /api/me/preferences`
- `POST /api/me/email-change-requests`
- `POST /api/me/email-changes/confirm`
- `GET /api/me/sessions`
- `DELETE /api/me/sessions/{id}`
- `POST /api/me/sessions/revoke-others`
- `PATCH /api/auth/me`
- `PATCH /api/auth/password`
- `GET /api/addresses`
- `POST /api/addresses`
- `PUT /api/addresses/{id}`
- `DELETE /api/addresses/{id}`
- `PATCH /api/addresses/{id}/default`

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
| `GET /api/me/profile` | Có phiên · Task sở hữu | — | `200` `data User` | 401, 403, 429 |
| `PATCH /api/me/profile` | Có phiên · Task sở hữu | body `expectedVersion*`, `displayName`, `phone`, `imageStorageId` | `200` `data User` | 400, 401, 403, 409, 429 |
| `GET /api/me/preferences` | Có phiên · Task sở hữu | — | `200` `data { locale, timezone, version }` | 401, 403, 429 |
| `PATCH /api/me/preferences` | Có phiên · Task sở hữu | body `locale*`, `timezone*`, `expectedVersion*` | `200` `data { locale, timezone, version }` | 400, 401, 403, 409, 429 |
| `POST /api/me/email-change-requests` | Có phiên · Task sở hữu | body `email*`, `currentPassword*` | `202` `data { accepted }` | 400, 401, 403, 409, 429 |
| `POST /api/me/email-changes/confirm` | Công khai · Task sở hữu | body `token*` | `200` `data { changed }` | 400, 409, 429 |
| `GET /api/me/sessions` | Có phiên · Dùng từ [FE-46](../../documents/p4/frontend/fe-46.md) | — | `200` `data { id, createdAt, expiresAt, revokedAt }[]` | 401, 403, 429 |
| `DELETE /api/me/sessions/{id}` | Có phiên · Dùng từ [FE-46](../../documents/p4/frontend/fe-46.md) | path `id*` | `200` `data { revoked }` | 401, 403, 404, 409, 429 |
| `POST /api/me/sessions/revoke-others` | Có phiên · Dùng từ [FE-46](../../documents/p4/frontend/fe-46.md) | — | `200` `data { revoked }` | 401, 403, 409, 429 |
| `GET /api/addresses` | Có phiên · Dùng từ [FE-45](../../documents/p4/frontend/fe-45.md) | query `page`, `pageSize 1–100`, `sortBy=fullName/city/isDefault/createdAt`, `sortOrder=asc/desc`, `q`, `city`, `isDefault=false/true` | `200` `data Address[] + meta` | 400, 401, 403, 429 |
| `POST /api/addresses` | Có phiên · Dùng từ [FE-45](../../documents/p4/frontend/fe-45.md) | body `fullName*`, `phone*`, `line1*`, `city*`, `isDefault` | `201` `data Address` | 400, 401, 403, 409, 429 |
| `PUT /api/addresses/{id}` | Có phiên · Dùng từ [FE-45](../../documents/p4/frontend/fe-45.md) | path `id*`<br>body `fullName`, `phone`, `line1`, `city`, `isDefault` | `200` `data Address` | 400, 401, 403, 404, 409, 429 |
| `DELETE /api/addresses/{id}` | Có phiên · Dùng từ [FE-45](../../documents/p4/frontend/fe-45.md) | path `id*` | `200` `data Address` | 401, 403, 404, 409, 429 |
| `PATCH /api/addresses/{id}/default` | Có phiên · Dùng từ [FE-45](../../documents/p4/frontend/fe-45.md) | path `id*` | `200` `data Address` | 401, 403, 404, 409, 429 |
| `PATCH /api/auth/me` | Có phiên · Tham chiếu | body `displayName`, `phone`, `imageStorageId` | `200` `data { user }` | 400, 401, 403, 409, 429 |
| `PATCH /api/auth/password` | Có phiên · Tham chiếu | body `currentPassword`, `newPassword*` | `200` `data { changed }` | 400, 401, 403, 409, 429 |
