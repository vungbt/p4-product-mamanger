# Plan — FE-14

[Spec](spec.md) · [FE-14](../../documents/frontend/fe-14.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/admin/promotions`
- `POST /api/admin/promotions`
- `GET /api/admin/promotions/{id}`
- `PATCH /api/admin/promotions/{id}`
- `GET /api/coupons`
- `POST /api/coupons`
- `GET /api/admin/coupons/{id}`
- `PUT /api/coupons/{id}`
- `DELETE /api/coupons/{id}`
- `GET /api/admin/coupons/{id}/redemptions`

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
| `GET /api/admin/promotions` | `promotion:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=name/priority/createdAt`, `sortOrder=asc/desc`, `q`, `isActive=false/true` | `200` `data Promotion[] + meta` | 400, 401, 403, 429 |
| `POST /api/admin/promotions` | `promotion:write` · Task sở hữu | body `type*`, `value*`, `minOrderAmount`, `maxDiscount`, `isActive`, `name*`, `priority` | `200` `data Promotion` | 400, 401, 403, 409, 429 |
| `GET /api/admin/promotions/{id}` | `promotion:read` · Task sở hữu | path `id*` | `200` `data Promotion` | 401, 403, 404, 429 |
| `PATCH /api/admin/promotions/{id}` | `promotion:write` · Task sở hữu | path `id*`<br>body `type*`, `value*`, `minOrderAmount`, `maxDiscount`, `isActive`, `name*`, `priority`, `expectedVersion*` | `200` `data Promotion` | 400, 401, 403, 404, 409, 429 |
| `GET /api/coupons` | `promotion:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=code/type/value/usedCount/startsAt/endsAt/createdAt`, `sortOrder=asc/desc`, `q`, `type=fixed/percent`, `isActive=false/true` | `200` `data Coupon[] + meta` | 400, 401, 403, 429 |
| `POST /api/coupons` | `promotion:write` · Task sở hữu | body `code*`, `type*`, `value*`, `minOrderAmount`, `maxDiscount`, `usageLimit`, `isActive`, `perUserLimit`, `expectedVersion` | `201` `data Coupon` | 400, 401, 403, 409, 429 |
| `GET /api/admin/coupons/{id}` | `promotion:read` · Task sở hữu | path `id*` | `200` `data Coupon` | 401, 403, 404, 429 |
| `PUT /api/coupons/{id}` | `promotion:write` · Task sở hữu | path `id*`<br>body `type*`, `value*`, `minOrderAmount`, `maxDiscount`, `isActive`, `code*`, `usageLimit`, `perUserLimit`, `expectedVersion` | `200` `data Coupon` | 400, 401, 403, 404, 409, 429 |
| `DELETE /api/coupons/{id}` | `promotion:write` · Task sở hữu | path `id*` | `200` `data Coupon` | 401, 403, 404, 409, 429 |
| `GET /api/admin/coupons/{id}/redemptions` | `promotion:read` · Task sở hữu | path `id*`<br>query `page`, `pageSize 1–100`, `sortBy=createdAt/amount`, `sortOrder=asc/desc`, `q` | `200` `data { createdAt, id, userId, status, orderId, amount, couponId, ruleVersion }[] + meta` | 400, 401, 403, 404, 429 |
