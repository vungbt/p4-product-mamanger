# Plan — FE-08

[Spec](spec.md) · [FE-08](../../documents/frontend/fe-08.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `POST /api/auth/register`
- `POST /api/auth/email-verification-requests`
- `POST /api/auth/password-reset-requests`
- `POST /api/auth/email-verifications`
- `POST /api/auth/password-resets`

Types request/response lấy từ contract sinh trong `@p4/api-sdk/shared`; enum/state nghiệp vụ dùng `@p4/shared`, `@p4/processes/shared`, `@p4/realtime/shared`. Không định nghĩa trùng hoặc ép type để lách schema.

### Luồng auth được chọn

Đăng ký/reset/xác minh mới ưu tiên Better Auth qua SDK `/auth` và callback URL cùng origin; các endpoint account cũ chỉ dùng cho luồng tương thích đang tồn tại. Không gửi token của một engine vào endpoint của engine còn lại.

- `POST /api/auth/sign-up/email`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`
- `GET /api/auth/verify-email`
- `POST /api/auth/send-verification-email`

## Tổ chức và kiểm chứng

- API client, query keys và resource query/mutation hooks nằm trong `libs/api-sdk`; component gọi hook trực tiếp. Hook feature chỉ xử lý state/handler màn hình, không tạo service hoặc hook chuyển tiếp. Props dùng ở đâu định nghĩa ở đó.
- Dùng component/icon/token của `@itclabs/react-ui`, tái sử dụng `libs/blocks`; không dựng lại UI primitives hoặc thêm wrapper/view chỉ để chuyển props.
- Áp dụng [quy ước UI và API](../../documents/frontend/README.md#quy-ước-nghiệm-thu-chung), có loading/empty/error/retry; lỗi field vào field, lỗi chung hiển thị tại form.
- Chạy typecheck/lint/build phù hợp và thao tác luồng thật qua API local. Ghi endpoint, tình huống, kết quả trong phần dưới; không coi mock data là nghiệm thu API.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `POST /api/auth/sign-up/email` | Theo Better Auth SDK · Task sở hữu | body `name*`, `email*`, `password*`, `image`, `callbackURL`, `rememberMe` | `200` `{ token, user }` | 400, 401, 403, 404, 422, 429, 500 |
| `POST /api/auth/request-password-reset` | Theo Better Auth SDK · Task sở hữu | body `email*`, `redirectTo` | `200` `{ status, message }` | 400, 401, 403, 404, 429, 500 |
| `POST /api/auth/reset-password` | Theo Better Auth SDK · Task sở hữu | body `newPassword*`, `token` | `200` `{ status }` | 400, 401, 403, 404, 429, 500 |
| `GET /api/auth/verify-email` | Theo Better Auth SDK · Task sở hữu | query `token*`, `callbackURL` | `200` `{ user, status }` | 400, 401, 403, 404, 429, 500 |
| `POST /api/auth/send-verification-email` | Theo Better Auth SDK · Task sở hữu | body `email*`, `callbackURL` | `200` `{ status }` | 400, 401, 403, 404, 429, 500 |
| `POST /api/auth/register` | Công khai · Tham chiếu | body `email*`, `password*`, `displayName*` | `201` `data { accepted }` | 400, 409, 429 |
| `POST /api/auth/email-verification-requests` | Công khai · Tham chiếu | body `email*` | `202` `data { accepted }` | 400, 409, 429 |
| `POST /api/auth/password-reset-requests` | Công khai · Tham chiếu | body `email*` | `202` `data { accepted }` | 400, 409, 429 |
| `POST /api/auth/email-verifications` | Công khai · Tham chiếu | body `token*` | `200` `data { verified }` | 400, 409, 429 |
| `POST /api/auth/password-resets` | Công khai · Tham chiếu | body `token*`, `password*` | `200` `data { changed }` | 400, 409, 429 |
