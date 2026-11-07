# Tasks — FE-41

- [ ] T001 Xác nhận phụ thuộc của [FE-41](../../documents/frontend/fe-41.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Tạo và sửa bảng size với nhiều dòng; mỗi dòng có `size` và các số đo lớn hơn 0, tối đa 1000.
- [ ] T003 (FR-002) — Giới hạn 1–100 dòng, lỗi `measurements` hiển thị rõ tại form.
- [ ] T004 (FR-003) — Sửa gửi `expectedVersion`; 409 cho tải lại mà không mất nội dung đang nhập.
- [ ] T005 (FR-004) — Gán được bảng size từ form sản phẩm ở FE-04.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/size-guides`, `GET /api/admin/size-guides/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/admin/size-guides`, `PATCH /api/admin/size-guides/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
