# Nghiệm thu — FE-23 · Quản trị yêu cầu đổi hàng

[Task nguồn](../../../documents/p4/frontend/fe-23.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Approve/reject, xem return/refund/replacement liên kết; chỉ tạo đơn thay sau điều kiện kiểm hàng.
- [ ] AC-002 (FR-002) — Double-click/retry không tạo hai replacement; làm rõ quote TTL và trường hợp phải duyệt lại.
- [ ] AC-003 (FR-003) — Nút tạo đơn thay thế chỉ gọi được một lần; gọi lặp nhận lại cùng đơn.
- [ ] AC-004 (FR-004) — Dẫn link được tới return, refund và đơn thay thế.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/exchanges` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/exchanges/{id}/approve` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `POST /api/exchanges/{id}/reject` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-04 `POST /api/exchanges/{id}/create-replacement` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Duyệt một yêu cầu đổi hợp lệ, thử duyệt lại với version cũ và tạo đơn thay thế theo trạng thái được phép. Xác nhận thao tác không lặp đơn.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
