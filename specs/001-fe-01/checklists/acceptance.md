# Nghiệm thu — FE-01 · Nền tảng phiên đăng nhập và quyền

[Task nguồn](../../../documents/p4/frontend/fe-01.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Dùng `@p4/api-sdk/auth`/AuthProvider hiện có: cookie HttpOnly, restore getSession, Google/email cùng luồng; không tạo JWT/refresh rotation hoặc lưu token vào localStorage. Logout/revoke dọn cache và socket.
- [ ] AC-002 (FR-002) — Route/menu/action dựa capability trả từ API; xử lý 401/403 và quyền đổi giữa phiên.
- [ ] AC-003 (FR-003) — Admin không có quyền vào route quản trị thấy trang 403, không bị đá về login.
- [ ] AC-004 (FR-004) — Google login và email login đi chung một luồng lưu phiên.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/auth/sign-in/email` · Email đúng tạo phiên; sai mật khẩu hiện lỗi và giữ form.
- [ ] API-02 `POST /api/auth/sign-in/social` · Google sandbox đi vào cùng luồng khôi phục phiên; người dùng hủy đăng nhập vẫn ở màn login.
- [ ] API-03 `GET /api/auth/get-session` · Reload sau login khôi phục đúng người dùng; sau logout trả phiên rỗng.
- [ ] API-04 `POST /api/auth/sign-out` · Logout về trang đích, cache tài khoản cũ được dọn và tải lại không khôi phục phiên.
- [ ] API-05 `GET /api/auth/me` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-06 `GET /api/me/capabilities` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Đăng nhập admin owner và staff chỉ đọc. Với staff, mở URL thiếu quyền và thấy 403 tại URL đó. Thu hồi phiên từ tài khoản có quyền, quay lại tab và xác nhận chuyển login, cache của staff được dọn.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
| AC-001 | Web local dùng API local, tài khoản admin seed | Đã kiểm tra đăng nhập email, giữ phiên khi mở lại Danh mục và đăng xuất về màn login. Integration test xác nhận cookie HttpOnly và phiên đã thu hồi trả 401. | Kiểm tra trình duyệt và hai suite `auth-audit`, `accounts`. Dọn cache đã rà trong code. Kiểm tra đóng kết nối chờ FE-10 tích hợp socket. |
| AC-002 | Web local với admin seed và API integration với staff `content` | Route, menu và thao tác ghi danh mục lấy quyền từ `GET /api/me/capabilities`. Query cập nhật khi cửa sổ lấy lại focus hoặc sau 30 giây khi đang hoạt động. | API test xác nhận staff thiếu `catalog:write` và nhận 403 khi ghi. Còn ca đổi quyền giữa phiên và xác nhận thao tác ẩn trên trình duyệt với staff giới hạn. |
| AC-003 | Route guard admin | Code hiển thị 403 ngay trên route khi thiếu capability. | Còn kiểm tra mở URL trực tiếp bằng tài khoản staff giới hạn trên trình duyệt. |
| AC-004 | AuthProvider hiện có | Đã đối chiếu email và Google dùng chung `persistSession`. | Còn chạy Google OAuth end-to-end. |

`pnpm lint`, build web/API và `git diff --check` đều đạt. SDK pass 6 test. Hai suite integration trên API local pass 19 test.
