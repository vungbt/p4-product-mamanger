# Nghiệm thu — FE-60 · Quản trị khách hàng

[Task nguồn](../../../documents/frontend/fe-60.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Màn customers riêng, server search/filter/sort/page theo contract; chỉ hiển thị thông tin được API trả.
- [ ] AC-002 (FR-002) — Khóa/mở theo capability, xác nhận, lý do/version nếu schema yêu cầu; nói rõ các phiên có thể bị revoke.
- [ ] AC-003 (FR-003) — Không dựng customer-detail/order-history endpoint mới từ FE; chỉ liên kết/filter đơn nếu API hỗ trợ tương ứng.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/customers` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `PATCH /api/admin/customers/{id}/status` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Lọc danh sách khách, đổi trạng thái bằng bản mới nhất và thử lại với version cũ. Tài khoản khách không thể gọi action quản trị.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
