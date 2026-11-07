# Plan — FE-11

[Spec](spec.md) · [FE-11](../../documents/frontend/fe-11.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `POST /api/admin/imports/{resource}`
- `GET /api/admin/import-templates/{resource}`
- `POST /api/admin/exports`
- `POST /api/processes/{id}/confirm`
- `GET /api/processes/{id}/items`
- `GET /api/processes/{id}/download`

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
| `POST /api/admin/imports/{resource}` | Có phiên · Task sở hữu | path `resource*`<br>header `Idempotency-Key*`<br>body `file*` | `202` `data { id, kind, state, phase, version, progress, processed, total, succeeded, failed, errorCode, result, createdAt, updatedAt, expiresAt }` | 400, 401, 403, 404, 409, 429 |
| `GET /api/admin/import-templates/{resource}` | Có phiên · Task sở hữu | path `resource*` | `200` `data { resource, columns, format, notes }` | 401, 403, 404, 429 |
| `POST /api/processes/{id}/confirm` | Có phiên · Task sở hữu | path `id*`<br>body `expectedVersion*` | `202` `data { id, kind, state, phase, version, progress, processed, total, succeeded, failed, errorCode, result, createdAt, updatedAt, expiresAt }` | 400, 401, 403, 404, 409, 429 |
| `POST /api/admin/exports` | Có phiên · Dùng từ [FE-48](../../documents/frontend/fe-48.md) | header `Idempotency-Key*`<br>body `query`, `resource`, `format` | `202` `data { id, kind, state, phase, version, progress, processed, total, succeeded, failed, errorCode, result, createdAt, updatedAt, expiresAt }` | 400, 401, 403, 409, 429 |
| `GET /api/processes/{id}/items` | Có phiên · Dùng từ [FE-10](../../documents/frontend/fe-10.md) | path `id*`<br>query `page`, `pageSize 1–100`, `sortBy=index/state/createdAt`, `sortOrder=asc/desc`, `q` | `200` `data { data, result, state, issues, index }[] + meta` | 400, 401, 403, 404, 429 |
| `GET /api/processes/{id}/download` | Có phiên · Dùng từ [FE-48](../../documents/frontend/fe-48.md) | path `id*` | `200` `application/octet-stream` | 401, 403, 404, 429 |
