# Nghiệm thu — FE-51 · Danh sách yêu thích

[Task nguồn](../../../documents/p4/frontend/fe-51.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Nút yêu thích ở card/PDP và trang wishlist khu tài khoản, đồng bộ cùng query cache.
- [ ] AC-002 (FR-002) — Khách được hướng dẫn login và quay lại; không giữ dữ liệu tài khoản trước khi logout/đổi user.
- [ ] AC-003 (FR-003) — Sản phẩm ngừng bán/ẩn có trạng thái phù hợp; thêm/xóa pending, lỗi rollback trạng thái nếu optimistic.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/wishlist` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `PUT /api/wishlist/items/{productId}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `DELETE /api/wishlist/items/{productId}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Thêm và bỏ yêu thích rồi reload. Chuyển tài khoản để xác nhận danh sách riêng. Sản phẩm không khả dụng hiển thị theo dữ liệu server.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
