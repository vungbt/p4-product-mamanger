# Tasks — FE-18

- [ ] T001 Xác nhận phụ thuộc của [FE-18](../../documents/p4/frontend/fe-18.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Phân bổ số lượng vào nhiều kiện; pack/ready/handover/deliver/fail/return/lose/cancel theo state/capability.
- [ ] T003 (FR-002) — Không chia vượt số lượng đã đặt; validation gắn đúng dòng/SKU, action không hợp lệ có lý do.
- [ ] T004 (FR-003) — Timeline từng kiện và đơn cập nhật bằng HTTP/realtime; retry không chuyển trạng thái hai lần; delivered không tự đồng nghĩa paid.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/orders/{id}/shipments`, `GET /api/shipments/{id}/events`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/orders/{id}/shipments`, `POST /api/shipments/{id}/pack`, `POST /api/shipments/{id}/ready`, `POST /api/shipments/{id}/handover`, `POST /api/shipments/{id}/out-for-delivery`, `POST /api/shipments/{id}/deliver`, `POST /api/shipments/{id}/fail`, `POST /api/shipments/{id}/return`, `POST /api/shipments/{id}/lose`, `POST /api/shipments/{id}/cancel`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
