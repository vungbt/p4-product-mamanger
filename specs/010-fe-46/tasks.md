# Tasks — FE-46

- [ ] T001 Xác nhận phụ thuộc của [FE-46](../../documents/p4/frontend/fe-46.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Màn security dùng cho Admin và Storefront: thay mật khẩu, xem phiên hiện tại/thiết bị và thu hồi một/tất cả phiên khác.
- [ ] T003 (FR-002) — Chọn một luồng native hoặc compatibility cho mỗi form; không gọi hai engine hoặc ghi token vào localStorage. Tôn trọng việc đổi mật khẩu có thể revoke phiên.
- [ ] T004 (FR-003) — Revoke phiên đang dùng dọn cache/socket rồi login; revoke phiên khác giữ phiên hiện tại. Hiển thị thời gian/expiry theo locale, che token khỏi UI/log.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/me/sessions`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/auth/change-password`, `DELETE /api/me/sessions/{id}`, `POST /api/me/sessions/revoke-others`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
