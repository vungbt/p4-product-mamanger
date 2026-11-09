# Plan — FE-44

[Spec](spec.md) · [FE-44](../../documents/frontend/fe-44.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Đối chiếu Scalar và generated contract hiện hành trước khi làm; chỉ dùng các field/query/action được API hỗ trợ.

- `GET /api/products/by-slug/{slug}`
- `GET /api/products/{id}`
- `GET /api/products/{id}/variants`
- `GET /api/products/{id}/reviews`
- `GET /api/products/{id}/review-summary`

## Tổ chức và kiểm chứng

- Request, query keys và query/mutation hooks thuộc `@p4/api-sdk`; mở rộng resource hooks tại SDK nếu thiếu. Component gọi trực tiếp; hook cạnh page chỉ giữ state/handler của màn, không tạo hook chuyển tiếp.
- Dùng `@itclabs/react-ui`, icon/theme P4 và business blocks sẵn có; áp dụng [quy ước chung](../../documents/frontend/README.md#quy-ước-nghiệm-thu-chung).
- Kiểm chứng API thật local: happy path, lỗi field, 401/403/404/409, pending/empty, retry và dữ liệu stale; desktop/mobile, keyboard và VI/EN. Không dùng production để tạo dữ liệu test.
- Chạy SDK typecheck/test khi đổi hooks, web build và root lint; ghi kết quả trước khi cập nhật trạng thái.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `GET /api/products/by-slug/{slug}` | Công khai · Task sở hữu | path `slug*` | `200` `data { product, redirect } / { product, redirect }` | 404, 429 |
| `GET /api/products/{id}` | Công khai · Task sở hữu | path `id*` | `200` `data Product` | 404, 429 |
| `GET /api/products/{id}/variants` | Công khai · Task sở hữu | path `id*` | `200` `data ProductVariant[]` | 404, 429 |
| `GET /api/products/{id}/reviews` | Công khai · Task sở hữu | path `id*`<br>query `page`, `pageSize 1–100`, `sortBy=rating/createdAt`, `sortOrder=asc/desc`, `q`, `rating 1–5` | `200` `data Review[] + meta` | 400, 404, 429 |
| `GET /api/products/{id}/review-summary` | Công khai · Task sở hữu | path `id*` | `200` `data { count, average, distribution }` | 404, 429 |
