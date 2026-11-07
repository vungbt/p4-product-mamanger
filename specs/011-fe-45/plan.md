# Plan — FE-45

[Spec](spec.md) · [FE-45](../../documents/frontend/fe-45.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Đối chiếu Scalar và generated contract hiện hành trước khi làm; chỉ dùng các field/query/action được API hỗ trợ.

- `GET /api/addresses`
- `POST /api/addresses`
- `PUT /api/addresses/{id}`
- `DELETE /api/addresses/{id}`
- `PATCH /api/addresses/{id}/default`

## Tổ chức và kiểm chứng

- Request, query keys và query/mutation hooks thuộc `@p4/api-sdk`; mở rộng resource hooks tại SDK nếu thiếu. Component gọi trực tiếp; hook cạnh page chỉ giữ state/handler của màn, không tạo hook chuyển tiếp.
- Dùng `@itclabs/react-ui`, icon/theme P4 và business blocks sẵn có; áp dụng [quy ước chung](../../documents/frontend/README.md#quy-ước-nghiệm-thu-chung).
- Kiểm chứng API thật local: happy path, lỗi field, 401/403/404/409, pending/empty, retry và dữ liệu stale; desktop/mobile, keyboard và VI/EN. Không dùng production để tạo dữ liệu test.
- Chạy SDK typecheck/test khi đổi hooks, web build và root lint; ghi kết quả trước khi cập nhật trạng thái.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `GET /api/addresses` | Có phiên · Task sở hữu | query `page`, `pageSize 1–100`, `sortBy=fullName/city/isDefault/createdAt`, `sortOrder=asc/desc`, `q`, `city`, `isDefault=false/true` | `200` `data Address[] + meta` | 400, 401, 403, 429 |
| `POST /api/addresses` | Có phiên · Task sở hữu | body `fullName*`, `phone*`, `line1*`, `city*`, `isDefault` | `201` `data Address` | 400, 401, 403, 409, 429 |
| `PUT /api/addresses/{id}` | Có phiên · Task sở hữu | path `id*`<br>body `fullName`, `phone`, `line1`, `city`, `isDefault` | `200` `data Address` | 400, 401, 403, 404, 409, 429 |
| `DELETE /api/addresses/{id}` | Có phiên · Task sở hữu | path `id*` | `200` `data Address` | 401, 403, 404, 409, 429 |
| `PATCH /api/addresses/{id}/default` | Có phiên · Task sở hữu | path `id*` | `200` `data Address` | 401, 403, 404, 409, 429 |
