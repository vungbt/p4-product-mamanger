# Tasks — FE-03

- [ ] T001 Xác nhận phụ thuộc của [FE-03](../../documents/frontend/fe-03.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Hiển thị draft/active/inactive/archived; bộ lọc và sort phía API.
- [ ] T003 (FR-002) — Chi tiết phân biệt thông tin sản phẩm và SKU; archive giữ dữ liệu đơn cũ, xác nhận trước thao tác.
- [ ] T004 (FR-003) — Filter/sort/page nằm trong URL và query key; quay lại danh sách giữ nguyên bộ lọc.
- [ ] T005 (FR-004) — Đổi trạng thái xuất bản gửi đúng version và xử lý 409.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/products`, `GET /api/admin/products/{id}`, `GET /api/admin/products/{id}/variants`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `PATCH /api/products/{id}/publication`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
