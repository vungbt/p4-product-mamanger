# Tasks — FE-25

- [ ] T001 Xác nhận phụ thuộc của [FE-25](../../documents/p4/frontend/fe-25.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Filter review trạng thái/sản phẩm; publish/hide/reply và xử lý reports theo quyền.
- [ ] T003 (FR-002) — Version conflict không mất nội dung; summary public chỉ phản ánh review đã publish.
- [ ] T004 (FR-003) — Thay đổi kiểm duyệt phản ánh đúng ở review summary public.
- [ ] T005 (FR-004) — Phản hồi và kiểm duyệt có quyền riêng (`review:reply`, `review:moderate`); thiếu quyền thì ẩn action.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/reviews`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/reviews/{id}/moderation`, `PUT /api/reviews/{id}/reply`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
