# Tasks — FE-29

- [ ] T001 Xác nhận phụ thuộc của [FE-29](../../documents/p4/frontend/fe-29.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Bell/unread badge/inbox dùng socket + HTTP; đọc một/đọc tất cả đồng bộ nhiều tab.
- [ ] T003 (FR-002) — Deduplicate event theo ID, refresh snapshot khi reconnect; preferences điều khiển channel và topic.
- [ ] T004 (FR-003) — Đọc một tab cập nhật badge ở tab khác và không đếm trùng khi socket gửi lại.
- [ ] T005 (FR-004) — Nằm trong khu tài khoản ở FE-40 cho Storefront và trên header cho Admin.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/notifications`, `GET /api/notifications/unread-count`, `GET /api/me/notification-preferences`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/notifications/read-all`, `POST /api/notifications/{id}/read`, `PATCH /api/me/notification-preferences`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
