# Plan — FE-46

[Spec](spec.md) · [FE-46](../../documents/frontend/fe-46.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Đối chiếu Scalar và generated contract hiện hành trước khi làm; chỉ dùng các field/query/action được API hỗ trợ.

- `POST /api/auth/change-password`
- `POST /api/auth/verify-password`
- `GET /api/auth/list-sessions`
- `POST /api/auth/revoke-session`
- `POST /api/auth/revoke-sessions`
- `POST /api/auth/revoke-other-sessions`
- `PATCH /api/auth/password`
- `GET /api/me/sessions`
- `DELETE /api/me/sessions/{id}`
- `POST /api/me/sessions/revoke-others`

## Tổ chức và kiểm chứng

- Request, query keys và query/mutation hooks thuộc `@p4/api-sdk`; mở rộng resource hooks tại SDK nếu thiếu. Component gọi trực tiếp; hook cạnh page chỉ giữ state/handler của màn, không tạo hook chuyển tiếp.
- Dùng `@itclabs/react-ui`, icon/theme P4 và business blocks sẵn có; áp dụng [quy ước chung](../../documents/frontend/README.md#quy-ước-nghiệm-thu-chung).
- Kiểm chứng API thật local: happy path, lỗi field, 401/403/404/409, pending/empty, retry và dữ liệu stale; desktop/mobile, keyboard và VI/EN. Không dùng production để tạo dữ liệu test.
- Chạy SDK typecheck/test khi đổi hooks, web build và root lint; ghi kết quả trước khi cập nhật trạng thái.

## Chọn một luồng quản lý phiên

Dùng Better Auth `change-password` cho đổi mật khẩu. Danh sách, thu hồi theo ID và thu hồi các phiên khác dùng `/api/me/sessions` để giữ các quy tắc nghiệp vụ và audit. Sau khi thu hồi, tải lại danh sách; nếu phiên hiện tại bị thu hồi thì dọn cache và điều hướng login. Native session endpoints khác chỉ để tham chiếu.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `POST /api/auth/change-password` | Theo Better Auth SDK · Task sở hữu | body `newPassword*`, `currentPassword*`, `revokeOtherSessions` | `200` `{ token, user }` | 400, 401, 403, 404, 429, 500 |
| `GET /api/me/sessions` | Có phiên · Task sở hữu | — | `200` `data { id, createdAt, expiresAt, revokedAt }[]` | 401, 403, 429 |
| `DELETE /api/me/sessions/{id}` | Có phiên · Task sở hữu | path `id*` | `200` `data { revoked }` | 401, 403, 404, 409, 429 |
| `POST /api/me/sessions/revoke-others` | Có phiên · Task sở hữu | — | `200` `data { revoked }` | 401, 403, 409, 429 |
| `POST /api/auth/verify-password` | Theo Better Auth SDK · Tham chiếu | body `password*` | `200` `{ status }` | 400, 401, 403, 404, 429, 500 |
| `GET /api/auth/list-sessions` | Theo Better Auth SDK · Tham chiếu | — | `200` `Auth_Session[]` | 400, 401, 403, 404, 429, 500 |
| `POST /api/auth/revoke-session` | Theo Better Auth SDK · Tham chiếu | body `token*` | `200` `{ status }` | 400, 401, 403, 404, 429, 500 |
| `POST /api/auth/revoke-sessions` | Theo Better Auth SDK · Tham chiếu | body `{  }` | `200` `{ status }` | 400, 401, 403, 404, 429, 500 |
| `POST /api/auth/revoke-other-sessions` | Theo Better Auth SDK · Tham chiếu | body `{  }` | `200` `{ status }` | 400, 401, 403, 404, 429, 500 |
| `PATCH /api/auth/password` | Có phiên · Tham chiếu | body `currentPassword`, `newPassword*` | `200` `data { changed }` | 400, 401, 403, 409, 429 |
