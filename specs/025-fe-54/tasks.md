# Tasks — FE-54

- [ ] T001 Xác nhận phụ thuộc của [FE-54](../../documents/frontend/fe-54.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Hai màn taxonomy list/create/edit đúng contract, slug từ tên có thể sửa, map lỗi trùng theo field.
- [ ] T003 (FR-002) — Bộ chọn category/tag dùng lại trong editor bài viết; invalidate đúng taxonomy sau mutation.
- [ ] T004 (FR-003) — Không thêm xóa/merge nếu API chưa có; public chỉ hiển thị taxonomy hợp lệ theo API.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/post-categories`, `GET /api/post-tags`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/admin/post-categories`, `PATCH /api/admin/post-categories/{id}`, `POST /api/admin/post-tags`, `PATCH /api/admin/post-tags/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
