# Tasks — FE-45

- [ ] T001 Xác nhận phụ thuộc của [FE-45](../../documents/p4/frontend/fe-45.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Màn danh sách/thêm/sửa/xóa địa chỉ owner; chọn mặc định và trạng thái rỗng rõ ràng.
- [ ] T003 (FR-002) — Dùng chung address editor/selector cho tài khoản và checkout; đổi mặc định không tự sửa snapshot đơn cũ.
- [ ] T004 (FR-003) — Field errors, stale version và xóa địa chỉ đang chọn được xử lý; chỉ có một mặc định theo dữ liệu server.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/addresses`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/addresses`, `PUT /api/addresses/{id}`, `DELETE /api/addresses/{id}`, `PATCH /api/addresses/{id}/default`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
