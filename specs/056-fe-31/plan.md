# Plan — FE-31

[Spec](spec.md) · [FE-31](../../documents/frontend/fe-31.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `POST /api/support/tickets`
- `GET /api/support/tickets/mine`
- `GET /api/admin/support/tickets`
- `GET /api/support/tickets/{id}`
- `GET /api/support/tickets/{id}/messages`
- `POST /api/support/tickets/{id}/messages`
- `POST /api/admin/support/tickets/{id}/assign`
- `POST /api/support/tickets/{id}/close`

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
| `POST /api/support/tickets` | Có phiên · Task sở hữu | body `orderId`, `subject*`, `category*`, `body*`, `attachmentIds` | `201` `data SupportTicket` | 400, 401, 403, 409, 429 |
| `GET /api/support/tickets/mine` | Có phiên · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=createdAt/subject/status`, `sortOrder=asc/desc`, `q`, `status=closed/in_progress/open/resolved`, `category=order/other/payment/product/return`, `assigneeId`, `orderId` | `200` `data SupportTicket[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/support/tickets` | `support:read` · Dùng từ [FE-59](../../documents/frontend/fe-59.md) | query `page`, `pageSize 1–100`, `sortBy=createdAt/subject/status`, `sortOrder=asc/desc`, `q`, `status=closed/in_progress/open/resolved`, `category=order/other/payment/product/return`, `assigneeId`, `orderId` | `200` `data SupportTicket[] + meta` | 400, 401, 403, 429 |
| `GET /api/support/tickets/{id}` | Có phiên · Dùng từ [FE-59](../../documents/frontend/fe-59.md) | path `id*` | `200` `data SupportTicket` | 401, 403, 404, 429 |
| `GET /api/support/tickets/{id}/messages` | Có phiên · Dùng từ [FE-59](../../documents/frontend/fe-59.md) | path `id*`<br>query `page`, `pageSize 1–100`, `sortBy=createdAt`, `sortOrder=asc/desc`, `q` | `200` `data SupportMessage[] + meta` | 400, 401, 403, 404, 429 |
| `POST /api/support/tickets/{id}/messages` | Có phiên · Dùng từ [FE-59](../../documents/frontend/fe-59.md) | path `id*`<br>body `expectedVersion*`, `body*`, `internal`, `attachmentIds` | `201` `data SupportMessage` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/support/tickets/{id}/assign` | `support:manage` · Dùng từ [FE-59](../../documents/frontend/fe-59.md) | path `id*`<br>body `assigneeId*`, `expectedVersion*` | `200` `data SupportTicket` | 400, 401, 403, 404, 409, 429 |
| `POST /api/support/tickets/{id}/close` | Có phiên · Dùng từ [FE-59](../../documents/frontend/fe-59.md) | path `id*`<br>body `reason*`, `expectedVersion*` | `200` `data SupportTicket` | 400, 401, 403, 404, 409, 429 |
