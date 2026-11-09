# Nghiệm thu — FE-17 · Quản trị đơn và huỷ từng phần

[Task nguồn](../../../documents/frontend/fe-17.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Danh sách/detail có snapshot tiền, SKU, address, timeline; action theo state/capability.
- [ ] AC-002 (FR-002) — Confirm/start processing/approve-reject cancellation gửi expectedVersion và idempotency; không sửa tổng tiền ở FE.
- [ ] AC-003 (FR-003) — Thay màn `admin/orders` hiện có thay vì tạo màn song song.
- [ ] AC-004 (FR-004) — Trạng thái đơn, thanh toán và vận chuyển hiển thị tách biệt.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/orders` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/orders/{id}/confirm` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `POST /api/orders/{id}/start-processing` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-04 `GET /api/orders/{id}/events` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-05 `GET /api/cancellation-requests/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-06 `POST /api/cancellation-requests/{id}/approve` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-07 `POST /api/cancellation-requests/{id}/reject` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-08 `POST /api/orders/{id}/cancel` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Huỷ một phần đơn nhiều dòng, reload và đối chiếu số lượng còn lại. Thử transition không hợp lệ hoặc version cũ và giữ snapshot đã xác nhận của server.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
