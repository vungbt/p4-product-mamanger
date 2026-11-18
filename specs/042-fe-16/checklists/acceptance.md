# Nghiệm thu — FE-16 · Thanh toán và trạng thái sau redirect

[Task nguồn](../../../documents/p4/frontend/fe-16.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — COD và payment attempt theo provider; redirect chỉ dẫn tới màn chờ đối soát, không tự đánh dấu paid.
- [ ] AC-002 (FR-002) — Refresh/back/double-click không tạo charge mới; xử lý expired/failed/pending qua trạng thái API.
- [ ] AC-003 (FR-003) — `mock-pay` chỉ hiện khi provider là mock; không xuất hiện ở production.
- [ ] AC-004 (FR-004) — Kiểm chứng Stripe bằng test mode trước khi đánh dấu hoàn thành, ghi rõ nếu chưa làm được.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/orders/{id}/payment-attempts` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.
- [ ] API-02 `GET /api/orders/{id}/payments` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `GET /api/orders/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `POST /api/payments/{id}/mock-pay` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Quay về từ Stripe sandbox lúc webhook chưa cập nhật. UI hiện đang đối soát, poll snapshot tới trạng thái cuối và refresh không sinh attempt mới. Chạy riêng nhánh COD.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
