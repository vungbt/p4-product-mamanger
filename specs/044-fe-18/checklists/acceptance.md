# Nghiệm thu — FE-18 · Đóng gói và vận hành nhiều kiện

[Task nguồn](../../../documents/frontend/fe-18.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Phân bổ số lượng vào nhiều kiện; pack/ready/handover/deliver/fail/return/lose/cancel theo state/capability.
- [ ] AC-002 (FR-002) — Không chia vượt số lượng đã đặt; validation gắn đúng dòng/SKU, action không hợp lệ có lý do.
- [ ] AC-003 (FR-003) — Timeline từng kiện và đơn cập nhật bằng HTTP/realtime; retry không chuyển trạng thái hai lần; delivered không tự đồng nghĩa paid.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/orders/{id}/shipments` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-02 `POST /api/orders/{id}/shipments` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `POST /api/shipments/{id}/pack` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-04 `POST /api/shipments/{id}/ready` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `POST /api/shipments/{id}/handover` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-06 `POST /api/shipments/{id}/out-for-delivery` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-07 `POST /api/shipments/{id}/deliver` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-08 `POST /api/shipments/{id}/fail` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-09 `POST /api/shipments/{id}/return` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-10 `POST /api/shipments/{id}/lose` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-11 `POST /api/shipments/{id}/cancel` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-12 `GET /api/shipments/{id}/events` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tách đơn thành hai kiện. Cập nhật tracking của một kiện và xác nhận kiện còn lại giữ trạng thái độc lập; vượt số lượng còn phân bổ phải hiện lỗi.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
