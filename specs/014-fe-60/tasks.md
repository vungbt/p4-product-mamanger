# Tasks — FE-60

- [ ] T001 Xác nhận phụ thuộc của [FE-60](../../documents/frontend/fe-60.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Màn customers riêng, server search/filter/sort/page theo contract; chỉ hiển thị thông tin được API trả.
- [ ] T003 (FR-002) — Khóa/mở theo capability, xác nhận, lý do/version nếu schema yêu cầu; nói rõ các phiên có thể bị revoke.
- [ ] T004 (FR-003) — Không dựng customer-detail/order-history endpoint mới từ FE; chỉ liên kết/filter đơn nếu API hỗ trợ tương ứng.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/customers`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `PATCH /api/admin/customers/{id}/status`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
