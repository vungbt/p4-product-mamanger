# Tasks — FE-23

- [ ] T001 Xác nhận phụ thuộc của [FE-23](../../documents/frontend/fe-23.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Approve/reject, xem return/refund/replacement liên kết; chỉ tạo đơn thay sau điều kiện kiểm hàng.
- [ ] T003 (FR-002) — Double-click/retry không tạo hai replacement; làm rõ quote TTL và trường hợp phải duyệt lại.
- [ ] T004 (FR-003) — Nút tạo đơn thay thế chỉ gọi được một lần; gọi lặp nhận lại cùng đơn.
- [ ] T005 (FR-004) — Dẫn link được tới return, refund và đơn thay thế.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/exchanges`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/exchanges/{id}/approve`, `POST /api/exchanges/{id}/reject`, `POST /api/exchanges/{id}/create-replacement`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
