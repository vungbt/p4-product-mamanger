# Tasks — FE-35

- [ ] T001 Xác nhận phụ thuộc của [FE-35](../../documents/frontend/fe-35.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Theo dõi pending/retry/dead letter, attempt và worker heartbeat; retry chỉ job được API cho phép.
- [ ] T003 (FR-002) — Inventory reconciliation là hành động riêng có xác nhận; không đưa nội bộ metrics cho storefront.
- [ ] T004 (FR-003) — Xem được từng lần chạy job kèm mã lỗi, lưu ý field `error_code`, `created_at` của attempts đang là snake_case.
- [ ] T005 (FR-004) — Thiếu quyền `system:manage` thì ẩn retry và đối soát.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/jobs`, `GET /api/admin/jobs/{id}`, `GET /api/internal/metrics`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/admin/jobs/{id}/retry`, `POST /api/admin/operations/inventory-reconciliation`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
