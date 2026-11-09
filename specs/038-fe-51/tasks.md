# Tasks — FE-51

- [ ] T001 Xác nhận phụ thuộc của [FE-51](../../documents/p4/frontend/fe-51.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Nút yêu thích ở card/PDP và trang wishlist khu tài khoản, đồng bộ cùng query cache.
- [ ] T003 (FR-002) — Khách được hướng dẫn login và quay lại; không giữ dữ liệu tài khoản trước khi logout/đổi user.
- [ ] T004 (FR-003) — Sản phẩm ngừng bán/ẩn có trạng thái phù hợp; thêm/xóa pending, lỗi rollback trạng thái nếu optimistic.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/wishlist`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `PUT /api/wishlist/items/{productId}`, `DELETE /api/wishlist/items/{productId}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
