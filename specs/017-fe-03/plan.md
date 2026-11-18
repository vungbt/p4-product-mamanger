# Plan — FE-03

[Spec](spec.md) · [FE-03](../../documents/p4/frontend/fe-03.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/admin/products`
- `GET /api/admin/products/{id}`
- `GET /api/admin/products/{id}/variants`
- `PATCH /api/products/{id}/publication`
- `GET /api/categories`

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
| `GET /api/admin/products` | `catalog:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=name/price/stock/createdAt`, `sortOrder=asc/desc`, `q`, `categoryId`, `size`, `color`, `availability=in_stock/out_of_stock`, `minRating 1–5`, `minPrice 0–2147483647`, `maxPrice 0–2147483647`, `minStock 0–2147483647`, `maxStock 0–2147483647` | `200` `data Product[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/products/{id}` | `catalog:read` · Task sở hữu | path `id*` | `200` `data CatalogProduct` | 401, 403, 404, 429 |
| `GET /api/admin/products/{id}/variants` | `catalog:read` · Task sở hữu | path `id*` | `200` `data ProductVariant[]` | 401, 403, 404, 429 |
| `PATCH /api/products/{id}/publication` | `catalog:write` · Task sở hữu | path `id*`<br>body `status*`, `expectedVersion*` | `200` `data CatalogProduct` | 400, 401, 403, 404, 409, 429 |
| `GET /api/categories` | Công khai · Dùng từ [FE-02](../../documents/p4/frontend/fe-02.md) | query `page`, `pageSize 1–100`, `sortBy=name/slug/description`, `sortOrder=asc/desc`, `q`, `description=all/has/none` | `200` `data Category[] + meta` | 400, 429 |
