# Tasks — FE-30

- [ ] T001 Xác nhận phụ thuộc của [FE-30](../../documents/p4/frontend/fe-30.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Chỉnh template theo allowlist biến API; preview có nội dung thiếu biến/lỗi validation.
- [ ] T003 (FR-002) — Version conflict và quyền truy cập rõ ràng; không hiển thị credential hay token tài khoản.
- [ ] T004 (FR-003) — Lưu mẫu gửi đúng version; lỗi thiếu biến hiển thị ngay tại form.
- [ ] T005 (FR-004) — Thiếu quyền `notification:manage` thì chỉ xem được.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/notification-templates`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `PUT /api/admin/notification-templates`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
