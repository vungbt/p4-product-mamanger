# Nghiệm thu — FE-46 · Bảo mật tài khoản và quản lý phiên

[Task nguồn](../../../documents/p4/frontend/fe-46.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Màn security dùng cho Admin và Storefront: thay mật khẩu, xem phiên hiện tại/thiết bị và thu hồi một/tất cả phiên khác.
- [ ] AC-002 (FR-002) — Chọn một luồng native hoặc compatibility cho mỗi form; không gọi hai engine hoặc ghi token vào localStorage. Tôn trọng việc đổi mật khẩu có thể revoke phiên.
- [ ] AC-003 (FR-003) — Revoke phiên đang dùng dọn cache/socket rồi login; revoke phiên khác giữ phiên hiện tại. Hiển thị thời gian/expiry theo locale, che token khỏi UI/log.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/auth/change-password` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `GET /api/me/sessions` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-03 `DELETE /api/me/sessions/{id}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.
- [ ] API-04 `POST /api/me/sessions/revoke-others` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Đăng nhập trên hai trình duyệt, thu hồi phiên còn lại và xác nhận request tiếp theo từ phiên đó bị từ chối. Thử đổi mật khẩu với mật khẩu hiện tại sai.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
