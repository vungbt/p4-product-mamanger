# Tasks — FE-32

- [ ] T001 Xác nhận phụ thuộc của [FE-32](../../documents/frontend/fe-32.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Danh sách nhân viên và vai trò theo capability, server filter/sort/page; gửi mời email theo API.
- [ ] T003 (FR-002) — Đổi role/status theo version, xác nhận ảnh hưởng phiên; không khóa/hạ quyền owner cuối cùng.
- [ ] T004 (FR-003) — Capability/menu/action cập nhật sau thay đổi quyền; không tự cấp role từ FE, kiểm thử 403 và nhân viên bị revoke phiên.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/roles`, `GET /api/admin/staff`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/admin/staff/invitations`, `PATCH /api/admin/staff/{id}/role`, `PATCH /api/admin/staff/{id}/status`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
