# Nghiệm thu — FE-35 · Job monitor và vận hành

[Task nguồn](../../../documents/p4/frontend/fe-35.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Theo dõi pending/retry/dead letter, attempt và worker heartbeat; retry chỉ job được API cho phép.
- [ ] AC-002 (FR-002) — Inventory reconciliation là hành động riêng có xác nhận; không đưa nội bộ metrics cho storefront.
- [ ] AC-003 (FR-003) — Xem được từng lần chạy job kèm mã lỗi, lưu ý field `error_code`, `created_at` của attempts đang là snake_case.
- [ ] AC-004 (FR-004) — Thiếu quyền `system:manage` thì ẩn retry và đối soát.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/jobs` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `GET /api/admin/jobs/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `POST /api/admin/jobs/{id}/retry` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-04 `GET /api/internal/metrics` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-05 `POST /api/admin/operations/inventory-reconciliation` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo một job lỗi có thể retry. Kiểm tra action chỉ xuất hiện khi có quyền và trạng thái cho phép; dùng snapshot mới để theo dõi lần chạy lại.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
