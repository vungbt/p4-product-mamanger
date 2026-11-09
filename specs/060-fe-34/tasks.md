# Tasks — FE-34

- [ ] T001 Xác nhận phụ thuộc của [FE-34](../../documents/p4/frontend/fe-34.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Filter actor/action/entity/date; detail requestId, thay đổi đã redact và phân trang server.
- [ ] T003 (FR-002) — Không cho sửa log; không render secret/token; permission audit tách khỏi menu Admin thông thường.
- [ ] T004 (FR-003) — Filter/page nằm trong URL; link từ thông báo lỗi tìm được theo `requestId`.
- [ ] T005 (FR-004) — Thiếu quyền `audit:read` thì không thấy menu.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/audit-logs`, `GET /api/admin/audit-logs/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
