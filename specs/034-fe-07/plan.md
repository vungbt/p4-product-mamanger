# Plan — FE-07

[Spec](spec.md) · [FE-07](../../documents/frontend/fe-07.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/products`
- `GET /api/products/facets`
- `GET /api/search/suggestions`
- `GET /api/products/by-slug/{slug}`
- `GET /api/products/{id}`
- `GET /api/products/{id}/variants`
- `GET /api/products/{id}/reviews`
- `GET /api/products/{id}/review-summary`
- `GET /api/categories`

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
| `GET /api/products` | Công khai · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=name/price/stock/createdAt`, `sortOrder=asc/desc`, `q`, `categoryId`, `size`, `color`, `availability=in_stock/out_of_stock`, `minRating 1–5`, `minPrice 0–2147483647`, `maxPrice 0–2147483647`, `minStock 0–2147483647`, `maxStock 0–2147483647` | `200` `data Product[] + meta` | 400, 429 |
| `GET /api/products/facets` | Công khai · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=name/price/stock/createdAt`, `sortOrder=asc/desc`, `q`, `categoryId`, `size`, `color`, `availability=in_stock/out_of_stock`, `minRating 1–5`, `minPrice 0–2147483647`, `maxPrice 0–2147483647`, `minStock 0–2147483647`, `maxStock 0–2147483647` | `200` `data { sizes, colors, categories, range }` | 400, 429 |
| `GET /api/search/suggestions` | Công khai · Dùng từ [FE-43](../../documents/frontend/fe-43.md) | query `q*` | `200` `data { products, categories }` | 400, 429 |
| `GET /api/products/by-slug/{slug}` | Công khai · Dùng từ [FE-44](../../documents/frontend/fe-44.md) | path `slug*` | `200` `data { product, redirect } / { product, redirect }` | 404, 429 |
| `GET /api/products/{id}` | Công khai · Dùng từ [FE-44](../../documents/frontend/fe-44.md) | path `id*` | `200` `data Product` | 404, 429 |
| `GET /api/products/{id}/variants` | Công khai · Dùng từ [FE-44](../../documents/frontend/fe-44.md) | path `id*` | `200` `data ProductVariant[]` | 404, 429 |
| `GET /api/products/{id}/reviews` | Công khai · Dùng từ [FE-44](../../documents/frontend/fe-44.md) | path `id*`<br>query `page`, `pageSize 1–100`, `sortBy=rating/createdAt`, `sortOrder=asc/desc`, `q`, `rating 1–5` | `200` `data Review[] + meta` | 400, 404, 429 |
| `GET /api/products/{id}/review-summary` | Công khai · Dùng từ [FE-44](../../documents/frontend/fe-44.md) | path `id*` | `200` `data { count, average, distribution }` | 404, 429 |
| `GET /api/categories` | Công khai · Dùng từ [FE-02](../../documents/frontend/fe-02.md) | query `page`, `pageSize 1–100`, `sortBy=name/slug/description`, `sortOrder=asc/desc`, `q`, `description=all/has/none` | `200` `data Category[] + meta` | 400, 429 |
