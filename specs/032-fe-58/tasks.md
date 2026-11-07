# Tasks — FE-58

- [ ] T001 Xác nhận phụ thuộc của [FE-58](../../documents/frontend/fe-58.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Sắp xếp section theo typed blocks được API hỗ trợ, chọn collection/banner đã có và bật/tắt theo contract.
- [ ] T003 (FR-002) — Preview desktop/mobile dùng renderer public, section trống/thiếu resource có fallback; không render HTML tùy ý.
- [ ] T004 (FR-003) — Lưu version và xử lý xung đột; đổi config phản ánh trang chủ FE-06 mà không hardcode thêm layout.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/home-layout`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `PATCH /api/admin/home-layout`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
