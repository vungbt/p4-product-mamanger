# Plan — FE-32

[Spec](spec.md) · [FE-32](../../documents/frontend/fe-32.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/admin/roles`
- `GET /api/admin/staff`
- `GET /api/admin/customers`
- `POST /api/admin/staff/invitations`
- `POST /api/staff/invitations/accept`
- `PATCH /api/admin/staff/{id}/role`
- `PATCH /api/admin/staff/{id}/status`
- `PATCH /api/admin/customers/{id}/status`

Types request/response lấy từ contract sinh trong `@p4/api-sdk/shared`; enum/state nghiệp vụ dùng `@p4/shared`, `@p4/processes/shared`, `@p4/realtime/shared`. Không định nghĩa trùng hoặc ép type để lách schema.

## Tổ chức và kiểm chứng

- API client, query keys và resource query/mutation hooks nằm trong `libs/api-sdk`; component gọi hook trực tiếp. Hook feature chỉ xử lý state/handler màn hình, không tạo service hoặc hook chuyển tiếp. Props dùng ở đâu định nghĩa ở đó.
- Dùng component/icon/token của `@itclabs/react-ui`, tái sử dụng `libs/blocks`; không dựng lại UI primitives hoặc thêm wrapper/view chỉ để chuyển props.
- Áp dụng [quy ước UI và API](../../documents/frontend/README.md#quy-ước-nghiệm-thu-chung), có loading/empty/error/retry; lỗi field vào field, lỗi chung hiển thị tại form.
- Chạy typecheck/lint/build phù hợp và thao tác luồng thật qua API local. Ghi endpoint, tình huống, kết quả trong phần dưới; không coi mock data là nghiệm thu API.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `GET /api/admin/roles` | `staff:read` · Task sở hữu | — | `200` `data object` | 401, 403, 429 |
| `GET /api/admin/staff` | `staff:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=email/displayName/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { role, staffRole, version, id, accountStatus, displayName, email }[] + meta` | 400, 401, 403, 429 |
| `POST /api/admin/staff/invitations` | `staff:manage` · Task sở hữu | body `email*`, `staffRole*` | `202` `data { accepted }` | 400, 401, 403, 409, 429 |
| `PATCH /api/admin/staff/{id}/role` | `staff:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `staffRole*`, `reason*` | `200` `data { id, staffRole, accountStatus, version }` | 400, 401, 403, 404, 409, 429 |
| `PATCH /api/admin/staff/{id}/status` | `staff:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `accountStatus*`, `reason*` | `200` `data { id, staffRole, accountStatus, version }` | 400, 401, 403, 404, 409, 429 |
| `GET /api/admin/customers` | `customer:read` · Dùng từ [FE-60](../../documents/frontend/fe-60.md) | query `page`, `pageSize 1–100`, `sortBy=email/displayName/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { role, staffRole, version, id, accountStatus, displayName, email }[] + meta` | 400, 401, 403, 429 |
| `POST /api/staff/invitations/accept` | Có phiên · Dùng từ [FE-47](../../documents/frontend/fe-47.md) | body `token*` | `200` `data { accepted, loginRequired }` | 400, 401, 403, 409, 429 |
| `PATCH /api/admin/customers/{id}/status` | `customer:manage` · Dùng từ [FE-60](../../documents/frontend/fe-60.md) | path `id*`<br>body `expectedVersion*`, `accountStatus*`, `reason*` | `200` `data { id, staffRole, accountStatus, version }` | 400, 401, 403, 404, 409, 429 |
