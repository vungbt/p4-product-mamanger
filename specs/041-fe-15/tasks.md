# Tasks — FE-15

- [ ] T001 Xác nhận phụ thuộc của [FE-15](../../documents/p4/frontend/fe-15.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Địa chỉ, phương thức giao và coupon tạo quote server; hiển thị subtotal/discount/shipping/total.
- [ ] T003 (FR-002) — Quote hết hạn hoặc giá đổi phải xác nhận lại; submit giữ Idempotency-Key cho một ý định đặt hàng.
- [ ] T004 (FR-003) — Đặt đơn gửi `quoteId`, không dùng luồng `items` theo `productId` cũ; gỡ code gọi luồng cũ sau khi chuyển.
- [ ] T005 (FR-004) — Hiển thị chính sách từ `GET /api/policies/current` trước khi đặt.
- [ ] T006 (FR-005) — Bấm đặt nhiều lần hoặc mạng lỗi rồi retry chỉ tạo một đơn.
- [ ] T007 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T008 Nối query/SDK cho `GET /api/checkout/quotes/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T009 Nối form hoặc action cho `POST /api/checkout/quotes`, `POST /api/shipping/quotes`, `POST /api/coupons/preview`, `POST /api/orders`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T010 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
