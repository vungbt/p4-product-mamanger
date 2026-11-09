# Nghiệm thu — FE-05 · SKU và biến thể sản phẩm

[Task nguồn](../../../documents/p4/frontend/fe-05.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Mỗi size/màu có SKU, giá, ảnh và trạng thái riêng; không sửa định danh SKU đã bán.
- [ ] AC-002 (FR-002) — Sửa SKU không gửi `stock`, `onHand`, `reserved`: tồn kho chỉ đổi qua FE-42.
- [ ] AC-003 (FR-003) — SKU trùng hiển thị lỗi đúng field; sản phẩm phải còn SKU hợp lệ thì mới publish được theo kết quả API.
- [ ] AC-004 (FR-004) — Danh sách `GET /api/admin/variants` tìm và lọc phía server, dẫn về đúng sản phẩm.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/products/{id}/variants` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `PATCH /api/products/{id}/variants/{variantId}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `PATCH /api/products/{id}/variants/{variantId}/images` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-04 `GET /api/admin/variants` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo tổ hợp size/màu, thử trùng SKU rồi cập nhật với version cũ. Giữ draft form và cho tải biến thể mới trước khi gửi lại.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
