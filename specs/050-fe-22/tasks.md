# Tasks — FE-22

- [ ] T001 Xác nhận phụ thuộc của [FE-22](../../documents/frontend/fe-22.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Chọn SKU thay thế, xem chênh lệch và luồng trả hàng; nêu rõ hoàn đơn cũ và trả tiền đơn mới độc lập.
- [ ] T003 (FR-002) — Không thể hiện credit giả; quote hết hạn/hết hàng phải báo và yêu cầu xác nhận lại.
- [ ] T004 (FR-003) — Chỉ chọn SKU còn hàng từ `GET /api/products/{id}/variants`.
- [ ] T005 (FR-004) — Hiển thị hai giao dịch độc lập: hoàn tiền đơn cũ và thanh toán đơn mới.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/exchanges/mine`, `GET /api/exchanges/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/orders/{id}/exchanges`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
