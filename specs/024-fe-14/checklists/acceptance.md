# Nghiệm thu — FE-14 · Promotions, coupons và quota

[Task nguồn](../../../documents/frontend/fe-14.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — CRUD thời gian/điều kiện/quota và lịch sử redemption, soft disable giữ lịch sử.
- [ ] AC-002 (FR-002) — Giải thích best promotion hoặc coupon được chọn; lỗi hết quota hiển thị đúng field/form.
- [ ] AC-003 (FR-003) — Áp dụng quy tắc một ưu đãi mỗi đơn: coupon nhập vào thay khuyến mãi tự động.
- [ ] AC-004 (FR-004) — Màn chi tiết coupon lấy dữ liệu từ `GET /api/admin/coupons/{id}`.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/promotions` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/admin/promotions` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `GET /api/admin/promotions/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `PATCH /api/admin/promotions/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `GET /api/coupons` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-06 `POST /api/coupons` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-07 `GET /api/admin/coupons/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-08 `PUT /api/coupons/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-09 `DELETE /api/coupons/{id}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.
- [ ] API-10 `GET /api/admin/coupons/{id}/redemptions` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server. ID/slug không tồn tại hiện trạng thái 404.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo coupon có điều kiện rồi thử giỏ đạt và không đạt điều kiện. Kết quả preview đến từ server; vượt quota hoặc hết hạn phải có thông báo.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
