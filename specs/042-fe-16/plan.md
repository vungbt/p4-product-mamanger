# Plan — FE-16

[Spec](spec.md) · [FE-16](../../documents/p4/frontend/fe-16.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `POST /api/orders/{id}/payment-attempts`
- `GET /api/orders/{id}/payments`
- `GET /api/orders/{id}`
- `POST /api/payments/{id}/mock-pay`

Types request/response lấy từ contract sinh trong `@p4/api-sdk/shared`; enum/state nghiệp vụ dùng `@p4/shared`, `@p4/processes/shared`, `@p4/realtime/shared`. Không định nghĩa trùng hoặc ép type để lách schema.

## Tổ chức và kiểm chứng

- API client, query keys và resource query/mutation hooks nằm trong `libs/api-sdk`; component gọi hook trực tiếp. Hook feature chỉ xử lý state/handler màn hình, không tạo service hoặc hook chuyển tiếp. Props dùng ở đâu định nghĩa ở đó.
- Dùng component/icon/token của `@itclabs/react-ui`, tái sử dụng `libs/blocks`; không dựng lại UI primitives hoặc thêm wrapper/view chỉ để chuyển props.
- Áp dụng [quy ước UI và API](../../documents/p4/frontend/README.md#quy-ước-nghiệm-thu-chung), có loading/empty/error/retry; lỗi field vào field, lỗi chung hiển thị tại form.
- Chạy typecheck/lint/build phù hợp và thao tác luồng thật qua API local. Ghi endpoint, tình huống, kết quả trong phần dưới; không coi mock data là nghiệm thu API.

## Trạng thái thanh toán

Chỉ khởi tạo attempt từ thao tác chủ động của khách; sau redirect hoặc reload đọc lại payment snapshot theo order ID. COD có nhánh riêng. Stripe test mode cần webhook hoạt động để xác nhận trạng thái cuối. `mock-pay` chỉ dành cho môi trường có provider mock.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `POST /api/orders/{id}/payment-attempts` | Có phiên · Task sở hữu | path `id*`<br>header `Idempotency-Key*`<br>body `provider*` | `201` `data { replayed, id, orderId, provider, status, amount, currency, checkoutUrl, reconciliation, expiresAt, paidAt, version }` | 400, 401, 403, 404, 409, 429 |
| `GET /api/orders/{id}/payments` | Có phiên · Task sở hữu | path `id*` | `200` `data PaymentAttempt[]` | 401, 403, 404, 429 |
| `GET /api/orders/{id}` | user, admin · Task sở hữu | path `id*` | `200` `data Order` | 401, 403, 404, 429 |
| `POST /api/payments/{id}/mock-pay` | Có phiên · Task sở hữu | path `id*` | `200` `data { accepted, reason, replayed, late, duplicate } / { accepted, replayed, reason, late, duplicate } / { accepted, late, duplicate, reason, replayed }` | 401, 403, 404, 409, 429 |
