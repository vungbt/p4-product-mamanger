# Plan — FE-21

[Spec](spec.md) · [FE-21](../../documents/p4/frontend/fe-21.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/admin/returns`
- `GET /api/returns/{id}`
- `POST /api/returns/{id}/approve`
- `POST /api/returns/{id}/reject`
- `POST /api/returns/{id}/in-transit`
- `POST /api/returns/{id}/receive`
- `POST /api/returns/{id}/inspect`
- `POST /api/returns/{id}/complete`
- `POST /api/orders/{id}/refunds`
- `GET /api/refunds`
- `GET /api/refunds/{id}`
- `POST /api/admin/refunds/{id}/reconcile`
- `POST /api/admin/refunds/{id}/retry`
- `POST /api/admin/refunds/{id}/manual-confirmation`
- `GET /api/files/{id}/download`

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
| `GET /api/admin/returns` | `return:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=createdAt/status`, `sortOrder=asc/desc`, `q`, `status=approved/cancelled/completed/in_transit/inspected/received/rejected/requested`, `orderId` | `200` `data ReturnRequest[] + meta` | 400, 401, 403, 429 |
| `POST /api/returns/{id}/approve` | `return:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reason` | `200` `data ReturnRequest` | 400, 401, 403, 404, 409, 429 |
| `POST /api/returns/{id}/reject` | `return:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reason` | `200` `data ReturnRequest` | 400, 401, 403, 404, 409, 429 |
| `POST /api/returns/{id}/in-transit` | `return:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reason` | `200` `data ReturnRequest` | 400, 401, 403, 404, 409, 429 |
| `POST /api/returns/{id}/receive` | `return:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reason` | `200` `data ReturnRequest` | 400, 401, 403, 404, 409, 429 |
| `POST /api/returns/{id}/inspect` | `return:manage` · Task sở hữu | path `id*`<br>body `inspection*`, `expectedVersion*`, `reason` | `200` `data ReturnRequest` | 400, 401, 403, 404, 409, 429 |
| `POST /api/returns/{id}/complete` | `return:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reason` | `200` `data ReturnRequest` | 400, 401, 403, 404, 409, 429 |
| `GET /api/files/{id}/download` | Có phiên · Task sở hữu | path `id*` | `200` `application/octet-stream` | 401, 403, 404, 429 |
| `GET /api/returns/{id}` | Có phiên · Dùng từ [FE-20](../../documents/p4/frontend/fe-20.md) | path `id*` | `200` `data ReturnRequest` | 401, 403, 404, 429 |
| `POST /api/orders/{id}/refunds` | `refund:manage` · Dùng từ [FE-50](../../documents/p4/frontend/fe-50.md) | path `id*`<br>header `Idempotency-Key*`<br>body `amount`, `returnId`, `reason*` | `201` `data { replayed, createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 400, 401, 403, 404, 409, 429 |
| `GET /api/refunds` | `refund:read` · Dùng từ [FE-50](../../documents/p4/frontend/fe-50.md) | query `page`, `pageSize 1–100`, `sortBy=amount/status/createdAt`, `sortOrder=asc/desc`, `q`, `orderId`, `status=completed/failed/pending`, `minAmount 0–2147483647`, `maxAmount 0–2147483647`, `createdFrom`, `createdTo` | `200` `data Refund[] + meta` | 400, 401, 403, 429 |
| `GET /api/refunds/{id}` | Có phiên · Dùng từ [FE-50](../../documents/p4/frontend/fe-50.md) | path `id*` | `200` `data { createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 401, 403, 404, 429 |
| `POST /api/admin/refunds/{id}/reconcile` | `refund:manage` · Dùng từ [FE-50](../../documents/p4/frontend/fe-50.md) | path `id*` | `200` `data { createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 401, 403, 404, 409, 429 |
| `POST /api/admin/refunds/{id}/retry` | `refund:manage` · Dùng từ [FE-50](../../documents/p4/frontend/fe-50.md) | path `id*`<br>body `expectedVersion*` | `200` `data { createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/refunds/{id}/manual-confirmation` | `refund:manage` · Dùng từ [FE-50](../../documents/p4/frontend/fe-50.md) | path `id*`<br>body `expectedVersion*`, `reference*`, `amount*` | `200` `data { createdAt, version, id, status, reason, orderId, returnId, processingStatus, amount }` | 400, 401, 403, 404, 409, 429 |
