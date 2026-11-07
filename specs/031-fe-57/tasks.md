# Tasks — FE-57

- [ ] T001 Xác nhận phụ thuộc của [FE-57](../../documents/frontend/fe-57.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Editor theo placement cho header/footer và mobile; chọn target theo schema, reorder bằng kéo thả và bàn phím.
- [ ] T003 (FR-002) — Chặn vòng lặp/độ sâu/liên kết sai theo validation API, không viết cứng menu public ở component.
- [ ] T004 (FR-003) — Lưu version, xử lý 409, preview từng viewport và nghiệm thu navigation public sau publish theo contract.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/navigation/{placement}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `PATCH /api/admin/navigation/{placement}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
