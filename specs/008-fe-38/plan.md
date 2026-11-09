# Plan — FE-38

[Spec](spec.md) · [FE-38](../../documents/frontend/fe-38.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `POST /api/files/uploads`
- `POST /api/files/uploads/{id}/complete`
- `GET /api/files/uploads/{id}`
- `POST /api/files/uploads/batch`
- `POST /api/files/uploads/batch/complete`
- `GET /api/files/{id}/download`
- `DELETE /api/files/{id}`
- `GET /api/files/sign-upload-url`
- `GET /api/files/sign-upload-urls`

Types request/response lấy từ contract sinh trong `@p4/api-sdk/shared`; enum/state nghiệp vụ dùng `@p4/shared`, `@p4/processes/shared`, `@p4/realtime/shared`. Không định nghĩa trùng hoặc ép type để lách schema.

## Tổ chức và kiểm chứng

- API client, query keys và resource query/mutation hooks nằm trong `libs/api-sdk`; component gọi hook trực tiếp. Hook feature chỉ xử lý state/handler màn hình, không tạo service hoặc hook chuyển tiếp. Props dùng ở đâu định nghĩa ở đó.
- Dùng component/icon/token của `@itclabs/react-ui`, tái sử dụng `libs/blocks`; không dựng lại UI primitives hoặc thêm wrapper/view chỉ để chuyển props.
- Áp dụng [quy ước UI và API](../../documents/frontend/README.md#quy-ước-nghiệm-thu-chung), có loading/empty/error/retry; lỗi field vào field, lỗi chung hiển thị tại form.
- Chạy typecheck/lint/build phù hợp và thao tác luồng thật qua API local. Ghi endpoint, tình huống, kết quả trong phần dưới; không coi mock data là nghiệm thu API.

## Thứ tự upload

Lấy ticket theo `purpose`, upload sang đích ký sẵn, gọi complete rồi đọc file hoặc process trả về. Chỉ chuyển ID file đã xác nhận cho form nghiệp vụ. Batch dùng process snapshot; FE xử lý lỗi theo từng file. Hai route sign-upload cũ để tham chiếu khi chuyển các màn đang gọi sang ticket.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `POST /api/files/uploads` | Có phiên · Task sở hữu | body `purpose*`, `resourceId` | `201` `data { allowedMimeTypes, uploadUrl, publicId, id, purpose, resourceId, status, private, expiresAt, fileId, maxBytes }` | 400, 401, 403, 409, 429 |
| `POST /api/files/uploads/{id}/complete` | Có phiên · Task sở hữu | path `id*` | `200` `data UploadTicket` | 401, 403, 404, 409, 429 |
| `GET /api/files/uploads/{id}` | Có phiên · Task sở hữu | path `id*` | `200` `data UploadTicket` | 401, 403, 404, 429 |
| `POST /api/files/uploads/batch` | Có phiên · Task sở hữu | body `purpose*`, `names*`, `resourceId` | `201` `data { batchId, tickets }` | 400, 401, 403, 409, 429 |
| `POST /api/files/uploads/batch/complete` | Có phiên · Task sở hữu | header `Idempotency-Key*`<br>body `ticketIds*` | `202` `data { id, kind, state, phase, version, progress, processed, total, succeeded, failed, errorCode, result, createdAt, updatedAt, expiresAt }` | 400, 401, 403, 409, 429 |
| `DELETE /api/files/{id}` | Có phiên · Task sở hữu | path `id*` | `200` `data { ok, id }` | 401, 403, 404, 409, 429 |
| `GET /api/files/{id}/download` | Có phiên · Dùng từ [FE-21](../../documents/frontend/fe-21.md) | path `id*` | `200` `application/octet-stream` | 401, 403, 404, 429 |
| `GET /api/files/sign-upload-url` | `catalog:write` · Tham chiếu | query `name` | `200` `data { allowedMimeTypes, uploadUrl, publicId, id, purpose, resourceId, status, private, expiresAt, fileId, maxBytes }` | 400, 401, 403, 429 |
| `GET /api/files/sign-upload-urls` | `catalog:write` · Tham chiếu | query `names` | `200` `data { allowedMimeTypes, uploadUrl, publicId, id, purpose, resourceId, status, private, expiresAt, fileId, maxBytes }[]` | 400, 401, 403, 429 |
