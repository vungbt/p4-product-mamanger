# Tasks — FE-09

- [ ] T001 Xác nhận phụ thuộc của [FE-09](../../documents/p4/frontend/fe-09.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Xem/sửa display name, phone, avatar qua profile versioned API; preferences locale/timezone đồng bộ app.
- [ ] T003 (FR-002) — Đổi email theo luồng account request/confirm hiện có; route callback xử lý token thiếu/hết hạn/đã dùng. Không trộn token native và compatibility.
- [ ] T004 (FR-003) — Avatar qua upload FE-38; xử lý field error/409 và không làm mất dữ liệu nhập khi tải lại.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/me/profile`, `GET /api/me/preferences`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `PATCH /api/me/profile`, `PATCH /api/me/preferences`, `POST /api/me/email-change-requests`, `POST /api/me/email-changes/confirm`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
