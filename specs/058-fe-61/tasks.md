# Tasks — FE-61

- [ ] T001 Xác nhận phụ thuộc của [FE-61](../../documents/frontend/fe-61.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Thay dashboard placeholder hiện có bằng KPI và blocks P4 dựa schema stats, có loading/error/empty và điều hướng đến màn liên quan.
- [ ] T003 (FR-002) — Nhận diện định nghĩa doanh thu/hoàn tiền/tồn theo contract, không tự suy doanh thu từ số đơn hoặc paid enum.
- [ ] T004 (FR-003) — Responsive, quyền thiếu không làm vỡ cả dashboard; analytics/report chuyên sâu ở FE-33, không làm hai bộ dữ liệu khác nhau.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/dashboard/stats`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
