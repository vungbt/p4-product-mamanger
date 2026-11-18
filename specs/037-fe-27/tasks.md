# Tasks — FE-27

- [ ] T001 Xác nhận phụ thuộc của [FE-27](../../documents/p4/frontend/fe-27.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — List/detail chỉ nội dung publish đúng lịch; slug redirect/404 rõ ràng.
- [ ] T003 (FR-002) — Render typed blocks an toàn, điều hướng category/tag và policy hiện hành ở checkout/footer.
- [ ] T004 (FR-003) — Blog và trang có title/description cho SEO từ `seoTitle`, `seoDescription`.
- [ ] T005 (FR-004) — Slug không tồn tại dùng trang 404 ở FE-40.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/posts`, `GET /api/posts/{slug}`, `GET /api/pages/{slug}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
