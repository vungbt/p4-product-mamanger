# Nghiệm thu — FE-21 · Duyệt và kiểm hàng trả

[Task nguồn](../../../documents/p4/frontend/fe-21.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — List/detail returns, approve/reject, in-transit/receive/inspect/complete theo API và capability.
- [ ] AC-002 (FR-002) — Kiểm hàng phân biệt saleable/damaged, chỉ restock sau inspection hợp lệ và đúng số lượng.
- [ ] AC-003 (FR-003) — Ảnh bằng chứng private qua authenticated download; link refund và order liên quan, không tự đánh dấu tiền đã hoàn.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/returns` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/returns/{id}/approve` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `POST /api/returns/{id}/reject` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-04 `POST /api/returns/{id}/in-transit` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `POST /api/returns/{id}/receive` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-06 `POST /api/returns/{id}/inspect` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-07 `POST /api/returns/{id}/complete` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-08 `GET /api/files/{id}/download` · Tải đúng file từ response; hết quyền hoặc hết hạn hiện lỗi, không dùng link cũ.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Duyệt và kiểm hàng trả; đối chiếu số lượng đã kiểm với trạng thái từ server. File bằng chứng chỉ mở được với tài khoản có quyền.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
