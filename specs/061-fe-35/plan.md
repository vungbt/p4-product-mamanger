# Plan — FE-35

[Spec](spec.md) · [FE-35](../../documents/p4/frontend/fe-35.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/admin/jobs`
- `GET /api/admin/jobs/{id}`
- `POST /api/admin/jobs/{id}/retry`
- `GET /api/internal/metrics`
- `POST /api/admin/operations/inventory-reconciliation`

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
| `GET /api/admin/jobs` | `system:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=createdAt/attempts`, `sortOrder=asc/desc`, `q`, `status=dead_letter/delivered/pending/processing` | `200` `data { availableAt, leaseUntil, deliveredAt, createdAt, type, id, status, aggregateType, aggregateId, attempts, lastErrorCode }[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/jobs/{id}` | `system:read` · Task sở hữu | path `id*` | `200` `data { attempts, availableAt, leaseUntil, deliveredAt, createdAt, type, id, status, aggregateType, aggregateId, lastErrorCode }` | 401, 403, 404, 429 |
| `POST /api/admin/jobs/{id}/retry` | `system:manage` · Task sở hữu | path `id*` | `200` `data { availableAt, leaseUntil, deliveredAt, createdAt, type, id, status, aggregateType, aggregateId, attempts, lastErrorCode }` | 401, 403, 404, 409, 429 |
| `GET /api/internal/metrics` | `system:read` · Task sở hữu | — | `200` `data { outbox, workerLastSeenAt }` | 401, 403, 429 |
| `POST /api/admin/operations/inventory-reconciliation` | `system:manage` · Task sở hữu | — | `200` `data { consistent, discrepancies }` | 401, 403, 409, 429 |
