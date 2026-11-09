# Tasks — FE-08

- [ ] T001 Xác nhận phụ thuộc của [FE-08](../../documents/frontend/fe-08.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Luồng gửi mail có thông báo trung tính; token hết hạn/đã dùng có trạng thái rõ ràng.
- [ ] T003 (FR-002) — Không đưa token vào analytics/log; reset xong xử lý phiên bị revoke và điều hướng login.
- [ ] T004 (FR-003) — Có màn nhận link từ email cho xác minh và đặt lại mật khẩu, kể cả khi token thiếu.
- [ ] T005 (FR-004) — Trang đích nằm trong khung ở FE-40 và đủ VI/EN.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/auth/verify-email`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/auth/sign-up/email`, `POST /api/auth/request-password-reset`, `POST /api/auth/reset-password`, `POST /api/auth/send-verification-email`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
