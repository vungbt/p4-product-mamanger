# Nghiệm thu — FE-09 · Hồ sơ và tùy chọn tài khoản

[Task nguồn](../../../documents/p4/frontend/fe-09.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Xem/sửa display name, phone, avatar qua profile versioned API; preferences locale/timezone đồng bộ app.
- [ ] AC-002 (FR-002) — Đổi email theo luồng account request/confirm hiện có; route callback xử lý token thiếu/hết hạn/đã dùng. Không trộn token native và compatibility.
- [ ] AC-003 (FR-003) — Avatar qua upload FE-38; xử lý field error/409 và không làm mất dữ liệu nhập khi tải lại.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/me/profile` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-02 `PATCH /api/me/profile` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `GET /api/me/preferences` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-04 `PATCH /api/me/preferences` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `POST /api/me/email-change-requests` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-06 `POST /api/me/email-changes/confirm` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Sửa profile ở hai tab để tạo xung đột. Tab stale hiện lỗi, giữ draft và cho lấy bản mới; đổi locale áp dụng trên cả hai portal.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
