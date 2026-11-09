# Nghiệm thu — FE-03 · Danh sách và chi tiết sản phẩm

[Task nguồn](../../../documents/p4/frontend/fe-03.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Hiển thị draft/active/inactive/archived; bộ lọc và sort phía API.
- [ ] AC-002 (FR-002) — Chi tiết phân biệt thông tin sản phẩm và SKU; archive giữ dữ liệu đơn cũ, xác nhận trước thao tác.
- [ ] AC-003 (FR-003) — Filter/sort/page nằm trong URL và query key; quay lại danh sách giữ nguyên bộ lọc.
- [ ] AC-004 (FR-004) — Đổi trạng thái xuất bản gửi đúng version và xử lý 409.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/products` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `GET /api/admin/products/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `GET /api/admin/products/{id}/variants` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `PATCH /api/products/{id}/publication` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Đổi trạng thái xuất bản của một sản phẩm hợp lệ. Admin thấy trạng thái mới; catalog công khai chỉ phản ánh bản được phép hiển thị.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
