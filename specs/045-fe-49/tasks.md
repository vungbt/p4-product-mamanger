# Tasks — FE-49

- [ ] T001 Xác nhận phụ thuộc của [FE-49](../../documents/frontend/fe-49.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Form thu COD gồm amount/reference, lịch sử và trạng thái thanh toán tách khỏi trạng thái kiện hàng.
- [ ] T003 (FR-002) — Không đánh dấu paid chỉ vì delivered; reconcile hiển thị kết quả từ server, không tự tính hoặc ghi đè số tiền.
- [ ] T004 (FR-003) — Action theo capability/state, xác nhận và idempotency; mạng lỗi/double click không thu hai lần, 409 giữ form.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối form hoặc action cho `POST /api/admin/payments/{id}/cod-collection`, `POST /api/admin/payments/{id}/reconcile`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
