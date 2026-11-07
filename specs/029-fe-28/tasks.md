# Tasks — FE-28

- [ ] T001 Xác nhận phụ thuộc của [FE-28](../../documents/frontend/fe-28.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — List/create/detail/edit manual collections và chọn sản phẩm đúng contract, version và validation.
- [ ] T003 (FR-002) — Không đưa sản phẩm draft/archived ra public; preview danh sách theo thứ tự đã cấu hình.
- [ ] T004 (FR-003) — Không làm banner/menu/home editor trong task này; kiểm thử missing config/404 và empty collection.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/collections`, `GET /api/admin/collections/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/admin/collections`, `PATCH /api/admin/collections/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
