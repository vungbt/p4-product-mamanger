# Nghiệm thu — FE-52 · Đăng ký báo có hàng

[Task nguồn](../../../documents/p4/frontend/fe-52.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — PDP hết hàng cho đăng ký đúng SKU/kênh theo API; chưa verify email hướng dẫn xác minh.
- [ ] AC-002 (FR-002) — Màn tài khoản xem và hủy subscription, hiển thị trạng thái server, không trùng khi bấm lại.
- [ ] AC-003 (FR-003) — Không hứa thời gian có hàng hoặc giả thông báo đã gửi; xử lý sản phẩm ngừng bán và đổi phiên.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/stock-alert-subscriptions` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `GET /api/stock-alert-subscriptions/mine` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-03 `DELETE /api/stock-alert-subscriptions/{id}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Đăng ký báo hàng cho SKU hết tồn, reload để kiểm tra trạng thái. Thử lặp thao tác và sau đó hủy đăng ký theo contract.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
