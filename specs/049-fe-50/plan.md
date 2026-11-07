# Plan — FE-50

[Spec](spec.md) · [FE-50](../../documents/frontend/fe-50.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Đối chiếu Scalar và generated contract hiện hành trước khi làm; chỉ dùng các field/query/action được API hỗ trợ.

- `POST /api/orders/{id}/refunds`
- `GET /api/refunds`
- `GET /api/refunds/{id}`
- `POST /api/admin/refunds/{id}/reconcile`
- `POST /api/admin/refunds/{id}/retry`
- `POST /api/admin/refunds/{id}/manual-confirmation`

## Tổ chức và kiểm chứng

- Request, query keys và query/mutation hooks thuộc `@p4/api-sdk`; mở rộng resource hooks tại SDK nếu thiếu. Component gọi trực tiếp; hook cạnh page chỉ giữ state/handler của màn, không tạo hook chuyển tiếp.
- Dùng `@itclabs/react-ui`, icon/theme P4 và business blocks sẵn có; áp dụng [quy ước chung](../../documents/frontend/README.md#quy-ước-nghiệm-thu-chung).
- Kiểm chứng API thật local: happy path, lỗi field, 401/403/404/409, pending/empty, retry và dữ liệu stale; desktop/mobile, keyboard và VI/EN. Không dùng production để tạo dữ liệu test.
- Chạy SDK typecheck/test khi đổi hooks, web build và root lint; ghi kết quả trước khi cập nhật trạng thái.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `POST /api/orders/{id}/refunds` | `refund:manage` · Task sở hữu | path `id*`<br>header `Idempotency-Key*`<br>body `amount`, `returnId`, `reason*` | `201` `data { replayed, createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 400, 401, 403, 404, 409, 429 |
| `GET /api/refunds` | `refund:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=amount/status/createdAt`, `sortOrder=asc/desc`, `q`, `orderId`, `status=completed/failed/pending`, `minAmount 0–2147483647`, `maxAmount 0–2147483647`, `createdFrom`, `createdTo` | `200` `data Refund[] + meta` | 400, 401, 403, 429 |
| `GET /api/refunds/{id}` | Có phiên · Task sở hữu | path `id*` | `200` `data { createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 401, 403, 404, 429 |
| `POST /api/admin/refunds/{id}/reconcile` | `refund:manage` · Task sở hữu | path `id*` | `200` `data { createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 401, 403, 404, 409, 429 |
| `POST /api/admin/refunds/{id}/retry` | `refund:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*` | `200` `data { createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/refunds/{id}/manual-confirmation` | `refund:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `amount*` | `200` `data { createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 400, 401, 403, 404, 409, 429 |
