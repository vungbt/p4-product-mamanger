# Plan — FE-39

[Spec](spec.md) · [FE-39](../../documents/frontend/fe-39.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Dùng các endpoint dưới đây để kiểm tra dữ liệu sau khi seed.

- `GET /api/storefront/home`
- `GET /api/admin/collections`
- `GET /api/admin/banners`
- `GET /api/admin/navigation/{placement}`
- `GET /api/admin/home-layout`
- `GET /api/admin/posts`
- `GET /api/admin/pages`
- `GET /api/post-categories`
- `GET /api/post-tags`
- `GET /api/policies/current`
- `GET /api/admin/promotions`
- `GET /api/admin/size-guides`
- `GET /api/admin/notification-templates`
- `GET /api/admin/support/tickets`
- `GET /api/admin/exchanges`
- `GET /api/admin/variants`

## Tổ chức và kiểm chứng

- Seeder đặt trong `apps/api/src/sequelize/seeders`, dùng lại dữ liệu và quy tắc của API; không tạo container hoặc database mới.
- Chạy `pnpm --filter @p4/api db:seed` hai lần liên tiếp và kiểm tra không tạo trùng; chạy `pnpm --filter @p4/api typecheck` và `pnpm --filter @p4/api test:lists`.
- Ghi số lượng dữ liệu tạo ra trong phần dưới.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `GET /api/storefront/home` | Công khai · Kiểm tra fixture | — | `200` `data { sections }` | 429 |
| `GET /api/admin/collections` | `content:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=key/active/createdAt`, `sortOrder=asc/desc`, `q`, `active=false/true` | `200` `data MerchandisingEntry[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/banners` | `content:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=key/active/createdAt`, `sortOrder=asc/desc`, `q`, `active=false/true` | `200` `data MerchandisingEntry[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/navigation/{placement}` | `content:read` · Kiểm tra fixture | path `placement*` | `200` `data MerchandisingEntry` | 401, 403, 404, 429 |
| `GET /api/admin/home-layout` | `content:read` · Kiểm tra fixture | — | `200` `data MerchandisingEntry` | 401, 403, 429 |
| `GET /api/admin/posts` | `content:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=title/createdAt`, `sortOrder=asc/desc`, `q`, `taxonomyId`, `status=archived/draft/published/scheduled` | `200` `data ContentEntry[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/pages` | `content:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=title/createdAt`, `sortOrder=asc/desc`, `q`, `taxonomyId`, `status=archived/draft/published/scheduled` | `200` `data ContentEntry[] + meta` | 400, 401, 403, 429 |
| `GET /api/post-categories` | Công khai · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=name/slug/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { id, slug, name }[] + meta` | 400, 429 |
| `GET /api/post-tags` | Công khai · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=name/slug/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { id, slug, name }[] + meta` | 400, 429 |
| `GET /api/policies/current` | Công khai · Kiểm tra fixture | — | `200` `data (PublishedContent / null)[]` | 429 |
| `GET /api/admin/promotions` | `promotion:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=name/priority/createdAt`, `sortOrder=asc/desc`, `q`, `isActive=false/true` | `200` `data Promotion[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/size-guides` | `catalog:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=name/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data SizeGuide[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/notification-templates` | `notification:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=type/locale/updatedAt`, `sortOrder=asc/desc`, `q`, `locale=en/vi`, `type` | `200` `data { version, type, id, body, subject, locale }[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/support/tickets` | `support:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=createdAt/subject/status`, `sortOrder=asc/desc`, `q`, `status=closed/in_progress/open/resolved`, `category=order/other/payment/product/return`, `assigneeId`, `orderId` | `200` `data SupportTicket[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/exchanges` | `return:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=createdAt/status`, `sortOrder=asc/desc`, `q`, `status=approved/awaiting_return/cancelled/completed/rejected/replacement_processing/requested/return_received`, `orderId` | `200` `data ExchangeRequest[] + meta` | 400, 401, 403, 429 |
| `GET /api/admin/variants` | `catalog:read` · Kiểm tra fixture | query `page`, `pageSize 1–100`, `sortBy=sku/price/onHand/reserved/createdAt`, `sortOrder=asc/desc`, `q`, `productId`, `status=active/inactive` | `200` `data InventoryBalance[] + meta` | 400, 401, 403, 429 |
