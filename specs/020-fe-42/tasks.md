# Tasks — FE-42

- [ ] T001 Xác nhận phụ thuộc của [FE-42](../../documents/p4/frontend/fe-42.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Phân biệt onHand, reserved và available; lọc theo SKU phía server.
- [ ] T003 (FR-002) — Nhập và điều chỉnh kho qua ledger, bắt buộc lý do và `Idempotency-Key`; retry không cộng kho hai lần.
- [ ] T004 (FR-003) — Xem lịch sử biến động theo SKU và có người thao tác, thời điểm, lý do.
- [ ] T005 (FR-004) — Màn đối soát hiển thị sai lệch từ `GET /api/admin/inventory/reconciliation` và không tự sửa số liệu.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/inventory`, `GET /api/admin/inventory/movements`, `GET /api/admin/inventory/reconciliation`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/admin/inventory/receipts`, `POST /api/admin/inventory/adjustments`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
