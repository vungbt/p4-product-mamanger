# Nghiệm thu — FE-08 · Đăng ký, xác minh và khôi phục tài khoản

[Task nguồn](../../../documents/frontend/fe-08.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Luồng gửi mail có thông báo trung tính; token hết hạn/đã dùng có trạng thái rõ ràng.
- [ ] AC-002 (FR-002) — Không đưa token vào analytics/log; reset xong xử lý phiên bị revoke và điều hướng login.
- [ ] AC-003 (FR-003) — Có màn nhận link từ email cho xác minh và đặt lại mật khẩu, kể cả khi token thiếu.
- [ ] AC-004 (FR-004) — Trang đích nằm trong khung ở FE-40 và đủ VI/EN.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/auth/sign-up/email` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `POST /api/auth/request-password-reset` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `POST /api/auth/reset-password` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-04 `GET /api/auth/verify-email` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-05 `POST /api/auth/send-verification-email` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Mở link xác minh/reset thật từ mail sandbox. Chạy lần hợp lệ rồi mở lại link đã dùng và link hết hạn. Với reset thành công, phiên trước đó bị thu hồi.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
