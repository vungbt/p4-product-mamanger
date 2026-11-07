# Plan — FE-24

[Spec](spec.md) · [FE-24](../../documents/frontend/fe-24.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `POST /api/order-items/{id}/reviews`
- `PATCH /api/reviews/{id}`
- `POST /api/reviews/{id}/reports`
- `POST /api/products/{id}/reviews`
- `DELETE /api/products/{id}/reviews/{reviewId}`
- `GET /api/products/{id}/review-summary`
- `GET /api/wishlist`
- `PUT /api/wishlist/items/{productId}`
- `DELETE /api/wishlist/items/{productId}`
- `POST /api/stock-alert-subscriptions`
- `GET /api/stock-alert-subscriptions/mine`
- `DELETE /api/stock-alert-subscriptions/{id}`

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
| `POST /api/order-items/{id}/reviews` | Có phiên · Task sở hữu | path `id*`<br>body `rating*`, `comment*`, `mediaIds` | `201` `data Review` | 400, 401, 403, 404, 409, 429 |
| `PATCH /api/reviews/{id}` | Có phiên · Task sở hữu | path `id*`<br>body `expectedVersion*`, `rating*`, `comment*` | `200` `data Review` | 400, 401, 403, 404, 409, 429 |
| `POST /api/reviews/{id}/reports` | Có phiên · Task sở hữu | path `id*`<br>body `reason*` | `202` `data { accepted }` | 400, 401, 403, 404, 409, 429 |
| `POST /api/products/{id}/reviews` | user, admin · Task sở hữu | path `id*`<br>body `rating*`, `comment*`, `orderItemId`, `mediaIds` | `201` `data Review` | 400, 401, 403, 404, 409, 429 |
| `DELETE /api/products/{id}/reviews/{reviewId}` | user, admin · Task sở hữu | path `id*`, `reviewId*` | `200` `data { ok }` | 401, 403, 404, 409, 429 |
| `GET /api/products/{id}/review-summary` | Công khai · Dùng từ [FE-44](../../documents/frontend/fe-44.md) | path `id*` | `200` `data { count, average, distribution }` | 404, 429 |
| `GET /api/wishlist` | Có phiên · Dùng từ [FE-51](../../documents/frontend/fe-51.md) | query `page`, `pageSize 1–100`, `sortBy=createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { id, productId, product }[] + meta` | 400, 401, 403, 429 |
| `PUT /api/wishlist/items/{productId}` | Có phiên · Dùng từ [FE-51](../../documents/frontend/fe-51.md) | path `productId*` | `200` `data { id, productId }` | 401, 403, 404, 409, 429 |
| `DELETE /api/wishlist/items/{productId}` | Có phiên · Dùng từ [FE-51](../../documents/frontend/fe-51.md) | path `productId*` | `200` `data { removed }` | 401, 403, 404, 409, 429 |
| `POST /api/stock-alert-subscriptions` | Có phiên · Dùng từ [FE-52](../../documents/frontend/fe-52.md) | body `variantId*` | `201` `data { id, status, variantId }` | 400, 401, 403, 409, 429 |
| `GET /api/stock-alert-subscriptions/mine` | Có phiên · Dùng từ [FE-52](../../documents/frontend/fe-52.md) | query `page`, `pageSize 1–100`, `sortBy=createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { id, status, variantId }[] + meta` | 400, 401, 403, 429 |
| `DELETE /api/stock-alert-subscriptions/{id}` | Có phiên · Dùng từ [FE-52](../../documents/frontend/fe-52.md) | path `id*` | `200` `data { cancelled }` | 401, 403, 404, 409, 429 |
