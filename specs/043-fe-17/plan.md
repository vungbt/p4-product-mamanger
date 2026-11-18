# Plan — FE-17

[Spec](spec.md) · [FE-17](../../documents/p4/frontend/fe-17.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/orders`
- `GET /api/orders/{id}`
- `POST /api/orders/{id}/confirm`
- `POST /api/orders/{id}/start-processing`
- `GET /api/orders/{id}/events`
- `GET /api/orders/{id}/payments`
- `GET /api/cancellation-requests/{id}`
- `POST /api/cancellation-requests/{id}/approve`
- `POST /api/cancellation-requests/{id}/reject`
- `POST /api/orders/{id}/cancel`

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
| `GET /api/orders` | `order:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=id/userEmail/status/total/createdAt`, `sortOrder=asc/desc`, `q`, `status=cancelled/completed/paid/pending/shipping`, `paymentStatus=failed/paid/pending`, `shipmentStatus=cancelled/delivered/pending/shipped`, `createdFrom`, `createdTo`, `minTotal 0–2147483647`, `maxTotal 0–2147483647` | `200` `data Order[] + meta` | 400, 401, 403, 429 |
| `POST /api/orders/{id}/confirm` | `order:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*` | `200` `data { id, lifecycleStatus, version }` | 400, 401, 403, 404, 409, 429 |
| `POST /api/orders/{id}/start-processing` | `order:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*` | `200` `data { id, lifecycleStatus, version }` | 400, 401, 403, 404, 409, 429 |
| `GET /api/orders/{id}/events` | Có phiên · Task sở hữu | path `id*`<br>query `page`, `pageSize 1–100`, `sortBy=createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { id, type, detail, createdAt }[] + meta` | 400, 401, 403, 404, 429 |
| `GET /api/cancellation-requests/{id}` | Có phiên · Task sở hữu | path `id*` | `200` `data CancellationRequest` | 401, 403, 404, 429 |
| `POST /api/cancellation-requests/{id}/approve` | `order:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reason` | `200` `data CancellationRequest` | 400, 401, 403, 404, 409, 429 |
| `POST /api/cancellation-requests/{id}/reject` | `order:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reason` | `200` `data CancellationRequest` | 400, 401, 403, 404, 409, 429 |
| `POST /api/orders/{id}/cancel` | user, admin · Task sở hữu | path `id*` | `200` `data Order` | 401, 403, 404, 409, 429 |
| `GET /api/orders/{id}` | user, admin · Dùng từ [FE-16](../../documents/p4/frontend/fe-16.md) | path `id*` | `200` `data Order` | 401, 403, 404, 429 |
| `GET /api/orders/{id}/payments` | Có phiên · Dùng từ [FE-16](../../documents/p4/frontend/fe-16.md) | path `id*` | `200` `data PaymentAttempt[]` | 401, 403, 404, 429 |
