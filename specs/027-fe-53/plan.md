# Plan — FE-53

[Spec](spec.md) · [FE-53](../../documents/p4/frontend/fe-53.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Đối chiếu Scalar và generated contract hiện hành trước khi làm; chỉ dùng các field/query/action được API hỗ trợ.

- `GET /api/admin/pages`
- `POST /api/admin/pages`
- `GET /api/admin/pages/{id}`
- `PATCH /api/admin/pages/{id}`
- `POST /api/admin/pages/{id}/publish`
- `POST /api/admin/pages/{id}/archive`
- `GET /api/policies/current`

## Tổ chức và kiểm chứng

- Request, query keys và query/mutation hooks thuộc `@p4/api-sdk`; mở rộng resource hooks tại SDK nếu thiếu. Component gọi trực tiếp; hook cạnh page chỉ giữ state/handler của màn, không tạo hook chuyển tiếp.
- Dùng `@itclabs/react-ui`, icon/theme P4 và business blocks sẵn có; áp dụng [quy ước chung](../../documents/p4/frontend/README.md#quy-ước-nghiệm-thu-chung).
- Kiểm chứng API thật local: happy path, lỗi field, 401/403/404/409, pending/empty, retry và dữ liệu stale; desktop/mobile, keyboard và VI/EN. Không dùng production để tạo dữ liệu test.
- Chạy SDK typecheck/test khi đổi hooks, web build và root lint; ghi kết quả trước khi cập nhật trạng thái.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `GET /api/admin/pages` | `content:read` · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=title/createdAt`, `sortOrder=asc/desc`, `q`, `taxonomyId`, `status=archived/draft/published/scheduled` | `200` `data ContentEntry[] + meta` | 400, 401, 403, 429 |
| `POST /api/admin/pages` | `content:write` · Task sở hữu | body `body*`, `slug*`, `title*`, `excerpt`, `coverFileId`, `taxonomyIds`, `seoTitle`, `seoDescription` | `201` `data ContentEntry` | 400, 401, 403, 409, 429 |
| `GET /api/admin/pages/{id}` | `content:read` · Task sở hữu | path `id*` | `200` `data ContentEntry` | 401, 403, 404, 429 |
| `PATCH /api/admin/pages/{id}` | `content:write` · Task sở hữu | path `id*`<br>body `body*`, `slug*`, `title*`, `excerpt`, `coverFileId`, `taxonomyIds`, `seoTitle`, `seoDescription`, `expectedVersion*` | `200` `data ContentEntry` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/pages/{id}/publish` | `content:publish` · Task sở hữu | path `id*`<br>body `scheduledAt`, `expectedVersion*` | `200` `data ContentEntry` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/pages/{id}/archive` | `content:publish` · Task sở hữu | path `id*`<br>body `expectedVersion*` | `200` `data ContentEntry` | 400, 401, 403, 404, 409, 429 |
| `GET /api/policies/current` | Công khai · Task sở hữu | — | `200` `data (PublishedContent / null)[]` | 429 |
