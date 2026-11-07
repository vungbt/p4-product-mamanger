# Tasks — FE-53

- [ ] T001 Xác nhận phụ thuộc của [FE-53](../../documents/frontend/fe-53.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — List/editor pages riêng với bài viết, draft/publish/archive theo capability và version; typed blocks và preview an toàn.
- [ ] T003 (FR-002) — Slug, SEO và nội dung chính sách tách với cấu hình policy nghiệp vụ FE-13; checkout dùng policy current do server trả.
- [ ] T004 (FR-003) — Draft không làm đổi public snapshot; không có endpoint delete/restore thì không dựng nút giả.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/pages`, `GET /api/admin/pages/{id}`, `GET /api/policies/current`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/admin/pages`, `PATCH /api/admin/pages/{id}`, `POST /api/admin/pages/{id}/publish`, `POST /api/admin/pages/{id}/archive`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
