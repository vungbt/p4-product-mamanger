# Tasks — FE-47

- [ ] T001 Xác nhận phụ thuộc của [FE-47](../../documents/frontend/fe-47.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Route public nhận link mời; kiểm tra thiếu/hết hạn/đã dùng, hiển thị lỗi và đường quay lại login Admin.
- [ ] T003 (FR-002) — Form tên/mật khẩu theo schema, không cho tự chọn role; role và email lấy từ lời mời đã được server kiểm tra.
- [ ] T004 (FR-003) — Sau accept đăng nhập bằng Better Auth, refresh capability; token không xuất hiện trong log/analytics và callback chỉ về route nội bộ.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối form hoặc action cho `POST /api/staff/invitations/accept`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
