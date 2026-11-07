# Tasks — FE-56

- [ ] T001 Xác nhận phụ thuộc của [FE-56](../../documents/frontend/fe-56.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — List/editor banner có ảnh/đích đến/lịch/status theo contract; ảnh qua upload chung.
- [ ] T003 (FR-002) — Preview responsive, alt text và liên kết HTTPS/nội bộ hợp lệ; thời gian theo timezone rồi UTC.
- [ ] T004 (FR-003) — Version conflict giữ nội dung, public không thấy banner draft/hết lịch; không tạo action API chưa hỗ trợ.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/banners`, `GET /api/admin/banners/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/admin/banners`, `PATCH /api/admin/banners/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
