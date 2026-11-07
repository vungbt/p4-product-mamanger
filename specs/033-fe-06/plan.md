# Plan — FE-06

[Spec](spec.md) · [FE-06](../../documents/frontend/fe-06.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `GET /api/storefront/home`
- `GET /api/navigation/{placement}`
- `GET /api/collections`
- `GET /api/collections/{slug}`
- `GET /api/shop/config`

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
| `GET /api/storefront/home` | Công khai · Task sở hữu | — | `200` `data { sections }` | 429 |
| `GET /api/navigation/{placement}` | Công khai · Task sở hữu | path `placement*` | `200` `data { placement, items }` | 404, 429 |
| `GET /api/collections` | Công khai · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=key/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data ({ id, slug, title, products, imageUrl, href, placement, items, sections } / { id, title, imageUrl, href, placement, slug, products, items, sections } / { placement, items, id, slug, title, products, imageUrl, href, sections } / { sections, id, slug, title, products, imageUrl, href, placement, items })[] + meta` | 400, 429 |
| `GET /api/collections/{slug}` | Công khai · Task sở hữu | path `slug*` | `200` `data { id, slug, title, products, imageUrl, href, placement, items, sections } / { id, title, imageUrl, href, placement, slug, products, items, sections } / { placement, items, id, slug, title, products, imageUrl, href, sections } / { sections, id, slug, title, products, imageUrl, href, placement, items }` | 404, 429 |
| `GET /api/shop/config` | Công khai · Dùng từ [FE-40](../../documents/frontend/fe-40.md) | — | `200` `data ShopSettings` | 429 |
