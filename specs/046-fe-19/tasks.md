# Tasks — FE-19

- [ ] T001 Xác nhận phụ thuộc của [FE-19](../../documents/frontend/fe-19.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Chỉ xem đơn owner; timeline theo từng kiện và các trạng thái tiền/đơn tách biệt.
- [ ] T003 (FR-002) — Chọn dòng/số lượng huỷ, gửi lý do, hiển thị chờ duyệt và hoàn tiền còn pending.
- [ ] T004 (FR-003) — Xem trạng thái hoàn tiền của đơn qua `GET /api/refunds/{id}`, không suy ra từ trạng thái đơn.
- [ ] T005 (FR-004) — Nằm trong khu tài khoản ở FE-40; URL đơn của người khác hiện 404.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/orders/mine`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/orders/{id}/cancellation-requests`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
