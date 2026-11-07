# Tasks — FE-26

- [ ] T001 Xác nhận phụ thuộc của [FE-26](../../documents/frontend/fe-26.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Post list/editor: tên/slug, typed content, category/tag, cover và SEO theo schema; ảnh dùng upload chung.
- [ ] T003 (FR-002) — Draft/publish/archive và version conflict không làm mất form; draft sửa không làm thay public snapshot.
- [ ] T004 (FR-003) — Không render HTML tùy ý; lịch xuất bản và revisions được ghép/kiểm chứng qua FE-55.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/posts`, `GET /api/admin/posts/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/admin/posts`, `POST /api/admin/posts/{id}/publish`, `POST /api/admin/posts/{id}/archive`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
