# Nghiệm thu — FE-49 · Thu COD và đối soát thanh toán

[Task nguồn](../../../documents/frontend/fe-49.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Form thu COD gồm amount/reference, lịch sử và trạng thái thanh toán tách khỏi trạng thái kiện hàng.
- [ ] AC-002 (FR-002) — Không đánh dấu paid chỉ vì delivered; reconcile hiển thị kết quả từ server, không tự tính hoặc ghi đè số tiền.
- [ ] AC-003 (FR-003) — Action theo capability/state, xác nhận và idempotency; mạng lỗi/double click không thu hai lần, 409 giữ form.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/admin/payments/{id}/cod-collection` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `POST /api/admin/payments/{id}/reconcile` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Thu COD cho kiện đủ điều kiện, retry cùng key và đối chiếu ledger chỉ có một lần thu. Không suy ra tiền đã thu từ trạng thái giao hàng.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
