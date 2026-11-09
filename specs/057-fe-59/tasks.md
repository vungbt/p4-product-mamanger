# Tasks — FE-59

- [ ] T001 Xác nhận phụ thuộc của [FE-59](../../documents/p4/frontend/fe-59.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — List filter/status/assignee theo query API; staff đọc, assign, trả lời hoặc thêm internal note đúng quyền.
- [ ] T003 (FR-002) — Attachment private và tin nhắn realtime không trùng; xử lý lỗi gửi và version conflict không mất bản nháp.
- [ ] T004 (FR-003) — Internal note không lọt sang Storefront; test cùng ticket từ cả hai tài khoản và lịch sử đã đóng.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/support/tickets`, `GET /api/support/tickets/{id}`, `GET /api/support/tickets/{id}/messages`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/support/tickets/{id}/messages`, `POST /api/admin/support/tickets/{id}/assign`, `POST /api/support/tickets/{id}/close`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
