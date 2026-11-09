# Tasks — FE-02

- [ ] T001 Xác nhận phụ thuộc của [FE-02](../../documents/p4/frontend/fe-02.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Search debounce 300ms, filter/sort/paging gọi API; reset trang khi query đổi.
- [ ] T003 (FR-002) — CRUD hiển thị lỗi field (kể cả trùng slug), sinh slug theo tên nhưng cho phép sửa; giữ bố cục category hiện có.
- [ ] T004 (FR-003) — Xoá danh mục đang có sản phẩm hiển thị đúng lỗi từ API; xác nhận trước khi xoá.
- [ ] T005 (FR-004) — Áp dụng căn giữa dọc của table cho cả mobile và desktop.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/categories`, `GET /api/categories/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
