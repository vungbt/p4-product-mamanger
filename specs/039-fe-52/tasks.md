# Tasks — FE-52

- [ ] T001 Xác nhận phụ thuộc của [FE-52](../../documents/p4/frontend/fe-52.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — PDP hết hàng cho đăng ký đúng SKU/kênh theo API; chưa verify email hướng dẫn xác minh.
- [ ] T003 (FR-002) — Màn tài khoản xem và hủy subscription, hiển thị trạng thái server, không trùng khi bấm lại.
- [ ] T004 (FR-003) — Không hứa thời gian có hàng hoặc giả thông báo đã gửi; xử lý sản phẩm ngừng bán và đổi phiên.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/stock-alert-subscriptions/mine`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/stock-alert-subscriptions`, `DELETE /api/stock-alert-subscriptions/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
