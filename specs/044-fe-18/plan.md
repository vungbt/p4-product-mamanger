# Plan — FE-18

[Spec](spec.md) · [FE-18](../../documents/frontend/fe-18.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/orders/{id}/shipments`
- `POST /api/orders/{id}/shipments`
- `POST /api/shipments/{id}/pack`
- `POST /api/shipments/{id}/ready`
- `POST /api/shipments/{id}/handover`
- `POST /api/shipments/{id}/out-for-delivery`
- `POST /api/shipments/{id}/deliver`
- `POST /api/shipments/{id}/fail`
- `POST /api/shipments/{id}/return`
- `POST /api/shipments/{id}/lose`
- `POST /api/shipments/{id}/cancel`
- `GET /api/shipments/{id}/events`
- `POST /api/admin/payments/{id}/cod-collection`
- `POST /api/admin/payments/{id}/reconcile`

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
| `GET /api/orders/{id}/shipments` | Có phiên · Task sở hữu | path `id*` | `200` `data FulfillmentShipment[]` | 401, 403, 404, 429 |
| `POST /api/orders/{id}/shipments` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `items`, `carrier*` | `201` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `POST /api/shipments/{id}/pack` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `trackingCode` | `200` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `POST /api/shipments/{id}/ready` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `trackingCode` | `200` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `POST /api/shipments/{id}/handover` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `trackingCode` | `200` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `POST /api/shipments/{id}/out-for-delivery` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `trackingCode` | `200` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `POST /api/shipments/{id}/deliver` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `trackingCode` | `200` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `POST /api/shipments/{id}/fail` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `trackingCode` | `200` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `POST /api/shipments/{id}/return` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `trackingCode` | `200` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `POST /api/shipments/{id}/lose` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `trackingCode` | `200` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `POST /api/shipments/{id}/cancel` | `fulfillment:manage` · Task sở hữu | path `id*`<br>body `expectedVersion*`, `reference*`, `trackingCode` | `200` `data FulfillmentShipment` | 400, 401, 403, 404, 409, 429 |
| `GET /api/shipments/{id}/events` | Có phiên · Task sở hữu | path `id*` | `200` `data { id, type, occurredAt }[]` | 401, 403, 404, 429 |
| `POST /api/admin/payments/{id}/cod-collection` | `payment:manage` · Dùng từ [FE-49](../../documents/frontend/fe-49.md) | path `id*`<br>body `reference*`, `amount*` | `200` `data { accepted, reason, replayed, late, duplicate } / { accepted, replayed, reason, late, duplicate } / { accepted, late, duplicate, reason, replayed }` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/payments/{id}/reconcile` | `payment:manage` · Dùng từ [FE-49](../../documents/frontend/fe-49.md) | path `id*` | `200` `data { accepted, reason, replayed, late, duplicate } / { accepted, replayed, reason, late, duplicate } / { accepted, late, duplicate, reason, replayed }` | 401, 403, 404, 409, 429 |
