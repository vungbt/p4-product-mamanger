# Nghiệm thu — FE-42 · Tồn kho và sổ kho

[Task nguồn](../../../documents/frontend/fe-42.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Phân biệt onHand, reserved và available; lọc theo SKU phía server.
- [ ] AC-002 (FR-002) — Nhập và điều chỉnh kho qua ledger, bắt buộc lý do và `Idempotency-Key`; retry không cộng kho hai lần.
- [ ] AC-003 (FR-003) — Xem lịch sử biến động theo SKU và có người thao tác, thời điểm, lý do.
- [ ] AC-004 (FR-004) — Màn đối soát hiển thị sai lệch từ `GET /api/admin/inventory/reconciliation` và không tự sửa số liệu.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/inventory` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `GET /api/admin/inventory/movements` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-03 `POST /api/admin/inventory/receipts` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.
- [ ] API-04 `POST /api/admin/inventory/adjustments` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.
- [ ] API-05 `GET /api/admin/inventory/reconciliation` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Nhập và điều chỉnh kho cho một SKU; đối chiếu available và movement history. Retry cùng Idempotency-Key không sinh movement trùng.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
