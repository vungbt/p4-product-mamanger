# Nghiệm thu — FE-12 · Giỏ hàng và merge sau login

[Task nguồn](../../../documents/frontend/fe-12.md) · [Spec](../spec.md)

- [ ] AC-001 — Giỏ theo SKU, số lượng và giá server; local guest cart merge đúng một lần.
- [ ] AC-002 — Hiển thị cảnh báo giá/tồn kho đổi và xử lý version conflict; giỏ không đồng nghĩa giữ hàng.
- [ ] AC-003 — Gỡ giỏ hàng cũ trong `apps/web/src/modules/storefront/cart` khỏi localStorage sau khi merge để không lệch giữa hai nguồn.
- [ ] AC-004 — Merge dùng `Idempotency-Key`; đăng nhập lại không cộng số lượng lần nữa.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/cart` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-02 `POST /api/cart/items` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `DELETE /api/cart/items` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-04 `PATCH /api/cart/items/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `DELETE /api/cart/items/{id}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-06 `POST /api/cart/merge` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo guest cart, làm mất response sau khi merge đã commit rồi retry cùng key. Kiểm tra số lượng không cộng hai lần, bản guest chưa được xác nhận vẫn còn và tài khoản khác không thấy cart cũ.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
