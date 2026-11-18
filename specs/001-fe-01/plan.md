# Plan — FE-01

[Spec](spec.md) · [FE-01](../../documents/p4/frontend/fe-01.md)

## Trình tự

1. Xác nhận phụ thuộc và rà phần đã có.
2. Đối chiếu contract bên dưới, sau đó triển khai theo [tasks](tasks.md).
3. Chạy [nghiệm thu](checklists/acceptance.md) và ghi kết quả về task nguồn.

## API và contract

Scalar local: `http://127.0.0.1:3001/api/docs`. Chọn Node.js → Axios để tham khảo; FE dùng `@p4/api-sdk` và hooks resource. Đối chiếu schema hiện hành trước khi triển khai.

- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-in/social`
- `GET /api/auth/get-session`
- `POST /api/auth/sign-out`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/me/capabilities`

Types request/response lấy từ contract sinh trong `@p4/api-sdk/shared`; enum/state nghiệp vụ dùng `@p4/shared`, `@p4/processes/shared`, `@p4/realtime/shared`. Không định nghĩa trùng hoặc ép type để lách schema.

## Tổ chức và kiểm chứng

- API client, query keys và resource query/mutation hooks nằm trong `libs/api-sdk`; component gọi hook trực tiếp. Hook feature chỉ xử lý state/handler màn hình, không tạo service hoặc hook chuyển tiếp. Props dùng ở đâu định nghĩa ở đó.
- Dùng component/icon/token của `@itclabs/react-ui`, tái sử dụng `libs/blocks`; không dựng lại UI primitives hoặc thêm wrapper/view chỉ để chuyển props.
- Áp dụng [quy ước UI và API](../../documents/p4/frontend/README.md#quy-ước-nghiệm-thu-chung), có loading/empty/error/retry; lỗi field vào field, lỗi chung hiển thị tại form.
- Chạy typecheck/lint/build phù hợp và thao tác luồng thật qua API local. Ghi endpoint, tình huống, kết quả trong phần dưới; không coi mock data là nghiệm thu API.

## Quyết định auth và quyền

Dùng `createP4AuthClient` cho email/Google, `getSession` để khôi phục và `signOut` để kết thúc. Đọc profile nghiệp vụ qua `GET /api/auth/me`, quyền qua `GET /api/me/capabilities`. Cache gắn với account. 401 đi qua luồng kết thúc phiên; 403 vẫn giữ phiên và URL. Web giữ session token trong bộ nhớ khi cần cấp cho realtime ở FE-10, cookie HttpOnly dùng để khôi phục phiên sau reload.

## Contract để bàn giao FE

Dấu `*` chỉ input bắt buộc trong schema. Lỗi là các mã được khai báo cho operation; quy tắc nghiệp vụ và giá trị enum đầy đủ đọc từ [OpenAPI](../../apps/api/openapi.yaml) và type sinh trong `@p4/api-sdk`.

| Operation | Quyền / sử dụng | Input | Thành công | Lỗi khai báo |
| --- | --- | --- | --- | --- |
| `POST /api/auth/sign-in/email` | Theo Better Auth SDK · Task sở hữu | body `email*`, `password*`, `callbackURL`, `rememberMe` | `200` `{ redirect, token, url, user }` | 400, 401, 403, 404, 429, 500 |
| `POST /api/auth/sign-in/social` | Theo Better Auth SDK · Task sở hữu | body `callbackURL`, `newUserCallbackURL`, `errorCallbackURL`, `provider*`, `disableRedirect`, `idToken`, `scopes`, `requestSignUp`, `loginHint`, `additionalParams`, `additionalData` | `200` `{ token, user, url, redirect }` | 400, 401, 403, 404, 429, 500 |
| `GET /api/auth/get-session` | Theo Better Auth SDK · Task sở hữu | — | `200` `object / null` | 400, 401, 403, 404, 429, 500 |
| `POST /api/auth/sign-out` | Theo Better Auth SDK · Task sở hữu | body `callbackURL`, `disableRedirect`, `state` | `200` `{ success, url, redirect }` | 400, 401, 403, 404, 429, 500 |
| `GET /api/auth/me` | Có phiên · Task sở hữu | — | `200` `data { user }` | 401, 403, 429 |
| `GET /api/me/capabilities` | Có phiên · Task sở hữu | — | `200` `data { contractVersion, permissions }` | 401, 403, 429 |
| `POST /api/auth/login` | Công khai · Tham chiếu | body `email*`, `password*` | `200` `data LoginResponse` | 400, 409, 429 |
| `POST /api/auth/google` | Công khai · Tham chiếu | body `credential*` | `200` `data LoginResponse` | 400, 409, 429 |
| `POST /api/auth/refresh` | Công khai · Tham chiếu | body `refreshToken*` | `200` `data LoginResponse` | 400, 409, 429 |
| `POST /api/auth/logout` | Công khai · Tham chiếu | body `refreshToken` | `200` `data { ok }` | 400, 409, 429 |
| `POST /api/auth/get-session` | Theo Better Auth SDK · Tham chiếu | body `{  }` | `200` `object / null` | 400, 401, 403, 404, 429, 500 |
