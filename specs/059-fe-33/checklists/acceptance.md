# Nghiệm thu — FE-33 · Báo cáo doanh thu, đơn, sản phẩm và kho

[Task nguồn](../../../documents/frontend/fe-33.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Báo cáo sales/orders/inventory/products, bộ lọc thời gian/timezone, charts/table và report export thống nhất.
- [ ] AC-002 (FR-002) — Revenue/refund/net theo ledger; cảnh báo dữ liệu legacy, không suy doanh thu từ paid enum.
- [ ] AC-003 (FR-003) — Khoảng thời gian/schema theo API, export202 qua process center và authenticated download; dashboard thuộc FE-61.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/reports/sales` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-02 `GET /api/admin/reports/orders` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-03 `GET /api/admin/reports/inventory` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-04 `GET /api/admin/reports/products` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-05 `POST /api/admin/report-exports` · Submit nhận 202 và mở trạng thái tác vụ; chỉ hiển thị kết quả khi job đạt trạng thái tương ứng. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.
- [ ] API-06 `GET /api/admin/report-exports/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-07 `GET /api/admin/report-exports/{id}/download` · Tải đúng file từ response; hết quyền hoặc hết hạn hiện lỗi, không dùng link cũ.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Chạy báo cáo theo cùng khoảng ngày trước và sau một giao dịch hoàn tiền. Đối chiếu số liệu với ledger và phân biệt giá trị rỗng với lỗi tải.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
