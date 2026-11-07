# Nghiệm thu — FE-50 · Quản trị hoàn tiền và xử lý lỗi provider

[Task nguồn](../../../documents/frontend/fe-50.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Màn list/detail refund có filter/page/sort, liên kết order/return và số tiền do server quyết định.
- [ ] AC-002 (FR-002) — Phân biệt pending/processing/failed/succeeded; chưa rõ kết quả phải reconcile, chỉ retry khi API cho phép.
- [ ] AC-003 (FR-003) — Manual COD confirmation bắt buộc reference; retry/confirm có idempotency/version theo endpoint, không báo thành công trước API.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/orders/{id}/refunds` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.
- [ ] API-02 `GET /api/refunds` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-03 `GET /api/refunds/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `POST /api/admin/refunds/{id}/reconcile` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-05 `POST /api/admin/refunds/{id}/retry` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-06 `POST /api/admin/refunds/{id}/manual-confirmation` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Kích hoạt hoàn tiền trên môi trường sandbox, kiểm tra pending/failed/succeeded từ API. Retry cùng ý định không tạo hoàn tiền lần hai.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
