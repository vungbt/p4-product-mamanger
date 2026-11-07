# Tasks — FE-17

- [ ] T001 Xác nhận phụ thuộc của [FE-17](../../documents/frontend/fe-17.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Danh sách/detail có snapshot tiền, SKU, address, timeline; action theo state/capability.
- [ ] T003 (FR-002) — Confirm/start processing/approve-reject cancellation gửi expectedVersion và idempotency; không sửa tổng tiền ở FE.
- [ ] T004 (FR-003) — Thay màn `admin/orders` hiện có thay vì tạo màn song song.
- [ ] T005 (FR-004) — Trạng thái đơn, thanh toán và vận chuyển hiển thị tách biệt.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/orders`, `GET /api/orders/{id}/events`, `GET /api/cancellation-requests/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/orders/{id}/confirm`, `POST /api/orders/{id}/start-processing`, `POST /api/cancellation-requests/{id}/approve`, `POST /api/cancellation-requests/{id}/reject`, `POST /api/orders/{id}/cancel`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
