# Tasks — FE-40

- [ ] T001 Xác nhận phụ thuộc của [FE-40](../../documents/p4/frontend/fe-40.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Layout khu tài khoản có menu tới đơn mua, địa chỉ, hồ sơ, wishlist, thông báo và hỗ trợ; menu chỉ hiện mục đã có màn hình.
- [ ] T003 (FR-002) — Route guard đưa khách chưa đăng nhập về login và quay lại đúng trang sau khi đăng nhập.
- [ ] T004 (FR-003) — Có trang 404, trang lỗi không tải được dữ liệu và error boundary cho lỗi render, đủ VI/EN.
- [ ] T005 (FR-004) — Thông tin shop ở header/footer lấy từ `GET /api/shop/config` thay vì viết cứng.
- [ ] T006 (FR-005) — Điều hướng mobile dùng được bằng bàn phím và không kẹt focus.
- [ ] T007 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T008 Nối query/SDK cho `GET /api/shop/config`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
