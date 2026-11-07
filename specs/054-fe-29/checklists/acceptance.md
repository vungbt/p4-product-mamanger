# Nghiệm thu — FE-29 · Inbox thông báo và preferences

[Task nguồn](../../../documents/frontend/fe-29.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Bell/unread badge/inbox dùng socket + HTTP; đọc một/đọc tất cả đồng bộ nhiều tab.
- [ ] AC-002 (FR-002) — Deduplicate event theo ID, refresh snapshot khi reconnect; preferences điều khiển channel và topic.
- [ ] AC-003 (FR-003) — Đọc một tab cập nhật badge ở tab khác và không đếm trùng khi socket gửi lại.
- [ ] AC-004 (FR-004) — Nằm trong khu tài khoản ở FE-40 cho Storefront và trên header cho Admin.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/notifications` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `GET /api/notifications/unread-count` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-03 `POST /api/notifications/read-all` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-04 `POST /api/notifications/{id}/read` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-05 `GET /api/me/notification-preferences` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-06 `PATCH /api/me/notification-preferences` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Mở inbox ở hai tab, nhận cùng một notification qua reconnect và đánh dấu đã đọc. ID không bị đếm trùng và badge khớp snapshot server.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
