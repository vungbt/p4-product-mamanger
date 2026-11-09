# Tasks — FE-31

- [ ] T001 Xác nhận phụ thuộc của [FE-31](../../documents/p4/frontend/fe-31.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Khách mở ticket gắn đơn/attachment private; list mine, detail, đọc/gửi tin và đóng theo quyền owner.
- [ ] T003 (FR-002) — Hiển thị pending/error/retry không trùng tin khi reconnect; gửi thất bại giữ draft.
- [ ] T004 (FR-003) — Không hiển thị internal notes/assignee nội bộ; API ID của khách khác phải bị từ chối và UI có trang lỗi đúng.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/support/tickets/mine`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/support/tickets`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
