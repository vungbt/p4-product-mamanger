# Nghiệm thu — FE-36 · Nghiệm thu xuyên Admin và Storefront

[Task nguồn](../../../documents/p4/frontend/fe-36.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Chạy luồng product → SKU/stock → checkout → payment → nhiều kiện → return/refund/exchange từ hai tài khoản.
- [ ] AC-002 (FR-002) — Kiểm tra 400/401/403/409, quyền/owner, socket disconnect, partial import, upload lỗi, double-submit và refresh giữa luồng.
- [ ] AC-003 (FR-003) — Kiểm tra 375/768/1440/1920px, keyboard/focus/tooltip/i18n, loading/empty/error; ghi kết quả và lỗi còn lại.

## Mốc nghiệm thu production

- [ ] Web triển khai tại `https://p4.couponlinkh.com`, `/api` proxy cùng origin; deep link SPA, refresh và cookie session hoạt động.
- [ ] Không gọi tạo đơn/thanh toán hoặc seed dữ liệu thử trên production. Dùng môi trường test có provider sandbox để chứng minh các luồng mua hàng.
- [ ] Logout/revoke/đổi quyền phải dọn dữ liệu riêng tư ở hai portal; kiểm tra web release rollback và báo lỗi kèm request ID.
- [ ] Rà [coverage](../../../documents/p4/frontend/api-coverage.md): tất cả operation có task hoặc lý do không có UI; các feature chưa bật không được dựng nút giả.

## Ca kiểm thử theo contract

- [ ] E2E-01 Admin tạo sản phẩm có SKU, nhập tồn và publish. Storefront thấy đúng SKU/giá/tồn và giỏ khách merge một lần sau đăng nhập.
- [ ] E2E-02 Checkout bằng quote qua COD và Stripe test mode. Mô phỏng response thất lạc và kiểm tra không tạo trùng đơn hoặc attempt.
- [ ] E2E-03 Admin tách đơn thành hai kiện, xử lý huỷ một phần và đối soát COD. Khách chỉ xem được dữ liệu của mình; kiểm tra tracking từng kiện.
- [ ] E2E-04 Trả hàng kèm file riêng tư, kiểm hàng, hoàn tiền, rồi chạy một yêu cầu đổi hàng có đơn thay thế. Đối chiếu ledger, tồn kho và số tiền từng giao dịch.
- [ ] E2E-05 Chạy import có dòng lỗi, upload batch có file lỗi, export có file hết hạn và reconnect khi job đang chạy. Đối chiếu tiến độ và notification sau khi đồng bộ lại.
- [ ] E2E-06 Đổi quyền hoặc thu hồi phiên của staff, kiểm tra cache, menu, hành động và audit; mở cả hai portal với tài khoản khác để xác nhận cách ly dữ liệu.
- [ ] Kiểm tra `GET /health/ready` của môi trường nghiệm thu trước khi bắt đầu các ca trên.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
