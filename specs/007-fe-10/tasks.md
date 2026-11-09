# Tasks — FE-10

- [ ] T001 Xác nhận phụ thuộc của [FE-10](../../documents/frontend/fe-10.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Dùng @p4/realtime/browser + @p4/processes/browser; kết nối theo token và dọn khi logout.
- [ ] T003 (FR-002) — Progress/version không lùi; reconnect replay + polling fallback, cancel, lỗi từng item và download hết hạn.
- [ ] T004 (FR-003) — Dùng được từ màn import, export và upload batch mà không viết lại logic theo dõi.
- [ ] T005 (FR-004) — File đã hết hạn hiển thị rõ, không hiện nút tải bị lỗi.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/processes`, `GET /api/processes/{id}`, `GET /api/processes/{id}/items`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/processes/{id}/cancel`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
