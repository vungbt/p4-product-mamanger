# Nghiệm thu — FE-22 · Đổi size/màu và đơn thay thế

[Task nguồn](../../../documents/frontend/fe-22.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Chọn SKU thay thế, xem chênh lệch và luồng trả hàng; nêu rõ hoàn đơn cũ và trả tiền đơn mới độc lập.
- [ ] AC-002 (FR-002) — Không thể hiện credit giả; quote hết hạn/hết hàng phải báo và yêu cầu xác nhận lại.
- [ ] AC-003 (FR-003) — Chỉ chọn SKU còn hàng từ `GET /api/products/{id}/variants`.
- [ ] AC-004 (FR-004) — Hiển thị hai giao dịch độc lập: hoàn tiền đơn cũ và thanh toán đơn mới.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/orders/{id}/exchanges` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `GET /api/exchanges/mine` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-03 `GET /api/exchanges/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Chọn SKU thay thế hết hàng rồi chọn SKU hợp lệ. UI tách khoản hoàn của đơn gốc khỏi thanh toán đơn mới và hiển thị chênh lệch như thông tin tham khảo.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
