# Nghiệm thu — FE-15 · Checkout bằng server quote

[Task nguồn](../../../documents/frontend/fe-15.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Địa chỉ, phương thức giao và coupon tạo quote server; hiển thị subtotal/discount/shipping/total.
- [ ] AC-002 (FR-002) — Quote hết hạn hoặc giá đổi phải xác nhận lại; submit giữ Idempotency-Key cho một ý định đặt hàng.
- [ ] AC-003 (FR-003) — Đặt đơn gửi `quoteId`, không dùng luồng `items` theo `productId` cũ; gỡ code gọi luồng cũ sau khi chuyển.
- [ ] AC-004 (FR-004) — Hiển thị chính sách từ `GET /api/policies/current` trước khi đặt.
- [ ] AC-005 (FR-005) — Bấm đặt nhiều lần hoặc mạng lỗi rồi retry chỉ tạo một đơn.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/checkout/quotes` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `GET /api/checkout/quotes/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `POST /api/shipping/quotes` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-04 `POST /api/coupons/preview` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-05 `POST /api/orders` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo quote, làm quote hết hạn rồi submit. Hiện yêu cầu báo giá lại và xác nhận tổng mới. Sau khi xác nhận, double-click hoặc retry cùng key chỉ tạo một đơn.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
