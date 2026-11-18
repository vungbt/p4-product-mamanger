# Nghiệm thu — FE-30 · Quản lý notification templates

[Task nguồn](../../../documents/p4/frontend/fe-30.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Chỉnh template theo allowlist biến API; preview có nội dung thiếu biến/lỗi validation.
- [ ] AC-002 (FR-002) — Version conflict và quyền truy cập rõ ràng; không hiển thị credential hay token tài khoản.
- [ ] AC-003 (FR-003) — Lưu mẫu gửi đúng version; lỗi thiếu biến hiển thị ngay tại form.
- [ ] AC-004 (FR-004) — Thiếu quyền `notification:manage` thì chỉ xem được.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/notification-templates` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `PUT /api/admin/notification-templates` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Sửa mẫu thông báo ở một ngôn ngữ, thử biến không hợp lệ và submit bản stale nếu operation dùng version. Giữ draft và hiện lỗi cạnh trường liên quan.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
