# Nghiệm thu — FE-44 · Chi tiết sản phẩm, gallery và chọn SKU

[Task nguồn](../../../documents/p4/frontend/fe-44.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Route theo slug; gallery, giá, mô tả, size guide và review summary lấy dữ liệu thật, có 404 và chuyển slug cũ đúng contract.
- [ ] AC-002 (FR-002) — Chọn size/màu xác định đúng SKU, đổi ảnh/giá/available; tổ hợp không hợp lệ hoặc hết hàng không thêm giỏ.
- [ ] AC-003 (FR-003) — Số lượng không vượt available, thêm giỏ chuyển đúng variant ID; keyboard/mobile hoạt động và không dùng productId thay SKU.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/products/by-slug/{slug}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-02 `GET /api/products/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `GET /api/products/{id}/variants` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `GET /api/products/{id}/reviews` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-05 `GET /api/products/{id}/review-summary` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Đổi màu/size sang tổ hợp hết hàng. Không thể thêm SKU đó, ảnh/giá/tồn khớp biến thể được chọn; link sản phẩm ẩn không làm lộ bản nháp.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
