# Nghiệm thu — FE-04 · Form sản phẩm và gallery nhiều ảnh

[Task nguồn](../../../documents/p4/frontend/fe-04.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Tạo/sửa tên, slug, mô tả, category, SEO, size guide; publish chỉ sau khi API cho phép.
- [ ] AC-002 (FR-002) — Upload nhiều ảnh qua ticket/batch process; hiển thị từng ảnh thành công/lỗi; không gắn file chưa verify.
- [ ] AC-003 (FR-003) — Dùng upload chung ở FE-38, không tự viết luồng upload riêng.
- [ ] AC-004 (FR-004) — Lỗi validate hiển thị đúng field; rời form khi còn thay đổi chưa lưu có cảnh báo.
- [ ] AC-005 (FR-005) — Xoá sản phẩm có xác nhận và hiển thị lỗi khi API từ chối.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/products` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-02 `PUT /api/products/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `DELETE /api/products/{id}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.
- [ ] API-04 `POST /api/products/{id}/images` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-05 `DELETE /api/products/{id}/images/{imageId}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo draft với bảng size và nhiều ảnh. Upload một ảnh lỗi và giữ các ảnh đã complete; mở lại chi tiết để xác nhận gallery theo thứ tự đã lưu.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
