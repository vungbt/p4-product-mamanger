# Plan — FE-15

[Spec](spec.md) · [FE-15](../../documents/p4/frontend/fe-15.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `POST /api/checkout/quotes`
- `GET /api/checkout/quotes/{id}`
- `POST /api/shipping/quotes`
- `POST /api/coupons/preview`
- `POST /api/orders`
- `GET /api/addresses`
- `GET /api/shop/config`
- `GET /api/policies/current`

Types request/response lấy từ contract sinh trong `@p4/api-sdk/shared`; enum/state nghiệp vụ dùng `@p4/shared`, `@p4/processes/shared`, `@p4/realtime/shared`. Không định nghĩa trùng hoặc ép type để lách schema.

## Tổ chức và kiểm chứng

- API client, query keys và resource query/mutation hooks nằm trong `libs/api-sdk`; component gọi hook trực tiếp. Hook feature chỉ xử lý state/handler màn hình, không tạo service hoặc hook chuyển tiếp. Props dùng ở đâu định nghĩa ở đó.
- Dùng component/icon/token của `@itclabs/react-ui`, tái sử dụng `libs/blocks`; không dựng lại UI primitives hoặc thêm wrapper/view chỉ để chuyển props.
- Áp dụng [quy ước UI và API](../../documents/p4/frontend/README.md#quy-ước-nghiệm-thu-chung), có loading/empty/error/retry; lỗi field vào field, lỗi chung hiển thị tại form.
- Chạy typecheck/lint/build phù hợp và thao tác luồng thật qua API local. Ghi endpoint, tình huống, kết quả trong phần dưới; không coi mock data là nghiệm thu API.

## Thứ tự dữ liệu checkout

Chọn địa chỉ và phương thức ship, gửi quote với lựa chọn hiện tại, rồi hiển thị snapshot server. Khi đổi địa chỉ, ship, coupon hoặc cart, yêu cầu quote mới. Khi bấm đặt, gửi `quoteId` cùng `Idempotency-Key`; không gửi `items` của luồng tạo đơn cũ. Với quote hết hạn hay conflict, tải lại và cho khách xác nhận tổng mới trước khi tạo ý định đặt hàng mới.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `POST /api/checkout/quotes` | Có phiên · Task sở hữu | body `items`, `addressId`, `shippingMethodId`, `couponCode` | `201` `data CheckoutQuote` | 400, 401, 403, 409, 429 |
| `GET /api/checkout/quotes/{id}` | Có phiên · Task sở hữu | path `id*` | `200` `data CheckoutQuote` | 401, 403, 404, 429 |
| `POST /api/shipping/quotes` | Công khai · Task sở hữu | body `items`, `city*`, `shippingMethodId` | `200` `data ShippingQuote[]` | 400, 409, 429 |
| `POST /api/coupons/preview` | Có phiên · Task sở hữu | body `code*`, `items*` | `200` `data { discountAmount, allocations, couponId, code }` | 400, 401, 403, 409, 429 |
| `POST /api/orders` | user · Task sở hữu | header `Idempotency-Key*`<br>body `quoteId`, `items`, `shippingAddress · ShippingAddressInput`, `addressId`, `couponCode` | `201` `data Order` | 400, 401, 403, 409, 429 |
| `GET /api/addresses` | Có phiên · Dùng từ [FE-45](../../documents/p4/frontend/fe-45.md) | query `page`, `pageSize 1–100`, `sortBy=fullName/city/isDefault/createdAt`, `sortOrder=asc/desc`, `q`, `city`, `isDefault=false/true` | `200` `data Address[] + meta` | 400, 401, 403, 429 |
| `GET /api/shop/config` | Công khai · Dùng từ [FE-40](../../documents/p4/frontend/fe-40.md) | — | `200` `data ShopSettings` | 429 |
| `GET /api/policies/current` | Công khai · Dùng từ [FE-53](../../documents/p4/frontend/fe-53.md) | — | `200` `data (PublishedContent / null)[]` | 429 |
