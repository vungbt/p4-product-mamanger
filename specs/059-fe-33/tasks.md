# Tasks — FE-33

- [ ] T001 Xác nhận phụ thuộc của [FE-33](../../documents/frontend/fe-33.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Báo cáo sales/orders/inventory/products, bộ lọc thời gian/timezone, charts/table và report export thống nhất.
- [ ] T003 (FR-002) — Revenue/refund/net theo ledger; cảnh báo dữ liệu legacy, không suy doanh thu từ paid enum.
- [ ] T004 (FR-003) — Khoảng thời gian/schema theo API, export202 qua process center và authenticated download; dashboard thuộc FE-61.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/reports/sales`, `GET /api/admin/reports/orders`, `GET /api/admin/reports/inventory`, `GET /api/admin/reports/products`, `GET /api/admin/report-exports/{id}`, `GET /api/admin/report-exports/{id}/download`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/admin/report-exports`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
