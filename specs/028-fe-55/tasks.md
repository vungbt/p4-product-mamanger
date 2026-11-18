# Tasks — FE-55

- [ ] T001 Xác nhận phụ thuộc của [FE-55](../../documents/p4/frontend/fe-55.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Xem revisions read-only và thay đổi giữa các bản khi dữ liệu API đủ; không dựng restore action khi không có endpoint.
- [ ] T003 (FR-002) — Lịch xuất bản nhập theo giờ người dùng, gửi UTC, hiển thị timezone; preview draft không public hóa dữ liệu.
- [ ] T004 (FR-003) — SEO title/description theo schema, link an toàn và cảnh báo rời form chưa lưu; publish phản ánh đúng snapshot public.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/posts/{id}/revisions`, `GET /api/admin/pages/{id}/revisions`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `PATCH /api/admin/posts/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
