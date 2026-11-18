# Plan — FE-43

[Spec](spec.md) · [FE-43](../../documents/p4/frontend/fe-43.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Đối chiếu Scalar và generated contract hiện hành trước khi làm; chỉ dùng các field/query/action được API hỗ trợ.

- `GET /api/search/suggestions`
- `GET /api/products`
- `GET /api/products/facets`

## Tổ chức và kiểm chứng

- Request, query keys và query/mutation hooks thuộc `@p4/api-sdk`; mở rộng resource hooks tại SDK nếu thiếu. Component gọi trực tiếp; hook cạnh page chỉ giữ state/handler của màn, không tạo hook chuyển tiếp.
- Dùng `@itclabs/react-ui`, icon/theme P4 và business blocks sẵn có; áp dụng [quy ước chung](../../documents/p4/frontend/README.md#quy-ước-nghiệm-thu-chung).
- Kiểm chứng API thật local: happy path, lỗi field, 401/403/404/409, pending/empty, retry và dữ liệu stale; desktop/mobile, keyboard và VI/EN. Không dùng production để tạo dữ liệu test.
- Chạy SDK typecheck/test khi đổi hooks, web build và root lint; ghi kết quả trước khi cập nhật trạng thái.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `GET /api/search/suggestions` | Công khai · Task sở hữu | query `q*` | `200` `data { products, categories }` | 400, 429 |
| `GET /api/products` | Công khai · Dùng từ [FE-07](../../documents/p4/frontend/fe-07.md) | query `page`, `pageSize 1–100`, `sortBy=name/price/stock/createdAt`, `sortOrder=asc/desc`, `q`, `categoryId`, `size`, `color`, `availability=in_stock/out_of_stock`, `minRating 1–5`, `minPrice 0–2147483647`, `maxPrice 0–2147483647`, `minStock 0–2147483647`, `maxStock 0–2147483647` | `200` `data Product[] + meta` | 400, 429 |
| `GET /api/products/facets` | Công khai · Dùng từ [FE-07](../../documents/p4/frontend/fe-07.md) | query `page`, `pageSize 1–100`, `sortBy=name/price/stock/createdAt`, `sortOrder=asc/desc`, `q`, `categoryId`, `size`, `color`, `availability=in_stock/out_of_stock`, `minRating 1–5`, `minPrice 0–2147483647`, `maxPrice 0–2147483647`, `minStock 0–2147483647`, `maxStock 0–2147483647` | `200` `data { sizes, colors, categories, range }` | 400, 429 |
