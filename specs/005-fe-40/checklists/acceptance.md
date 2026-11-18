# Nghiệm thu — FE-40 · Khung Storefront: khu tài khoản, 404 và trang lỗi

[Task nguồn](../../../documents/p4/frontend/fe-40.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Layout khu tài khoản có menu tới đơn mua, địa chỉ, hồ sơ, wishlist, thông báo và hỗ trợ; menu chỉ hiện mục đã có màn hình.
- [ ] AC-002 (FR-002) — Route guard đưa khách chưa đăng nhập về login và quay lại đúng trang sau khi đăng nhập.
- [ ] AC-003 (FR-003) — Có trang 404, trang lỗi không tải được dữ liệu và error boundary cho lỗi render, đủ VI/EN.
- [ ] AC-004 (FR-004) — Thông tin shop ở header/footer lấy từ `GET /api/shop/config` thay vì viết cứng.
- [ ] AC-005 (FR-005) — Điều hướng mobile dùng được bằng bàn phím và không kẹt focus.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/shop/config` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Mở URL tài khoản khi chưa login, đăng nhập rồi quay lại đúng URL nội bộ. Khi shop config lỗi vẫn điều hướng được; route lạ hiển thị 404.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
