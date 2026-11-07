# Nghiệm thu — FE-13 · Cấu hình shop và vận chuyển

[Task nguồn](../../../documents/frontend/fe-13.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Form versioned shop/policy/shipping; zone, phí, miễn phí theo ngưỡng và COD rõ ràng.
- [ ] AC-002 (FR-002) — Không expose secret; 409 cho tải lại cấu hình thay vì ghi đè người khác.
- [ ] AC-003 (FR-003) — Thay đổi cấu hình phản ánh đúng ở `GET /api/shop/config` phía Storefront.
- [ ] AC-004 (FR-004) — Phương thức vận chuyển mới dùng được ngay ở FE-15.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/settings/shop` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-02 `PATCH /api/admin/settings/shop` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `GET /api/admin/settings/commerce` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-04 `PATCH /api/admin/settings/commerce` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `GET /api/admin/shipping-methods` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-06 `POST /api/admin/shipping-methods` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-07 `GET /api/admin/shipping-methods/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-08 `PATCH /api/admin/shipping-methods/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Đổi cấu hình shop và phương thức giao hàng bằng tài khoản có quyền; storefront tải lại cấu hình. Phương thức tắt không còn khả dụng cho quote mới.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
