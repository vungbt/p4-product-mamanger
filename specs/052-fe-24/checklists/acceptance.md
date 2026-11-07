# Nghiệm thu — FE-24 · Viết và quản lý đánh giá đã mua

[Task nguồn](../../../documents/frontend/fe-24.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Chỉ viết review cho order item được API cho phép; pending moderation chưa xuất hiện public; ảnh dùng upload chung.
- [ ] AC-002 (FR-002) — Sửa/xóa/report theo endpoint hiện có và owner/capability; legacy product review không dùng để tạo mới.
- [ ] AC-003 (FR-003) — Summary/reviews public refresh theo trạng thái server; không expose email khách, kiểm thử pending/rejected/published.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/order-items/{id}/reviews` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `PATCH /api/reviews/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `POST /api/reviews/{id}/reports` · Submit nhận 202 và mở trạng thái tác vụ; chỉ hiển thị kết quả khi job đạt trạng thái tương ứng.
- [ ] API-04 `POST /api/products/{id}/reviews` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-05 `DELETE /api/products/{id}/reviews/{reviewId}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tài khoản có đơn đủ điều kiện gửi review; tài khoản chưa mua hoặc review trùng nhận lỗi. Phản ánh trạng thái kiểm duyệt từ API.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
