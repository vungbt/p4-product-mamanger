# Tasks — FE-20

- [ ] T001 Xác nhận phụ thuộc của [FE-20](../../documents/p4/frontend/fe-20.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Chỉ chọn số lượng đã giao còn trong thời hạn và chưa nằm trong yêu cầu khác.
- [ ] T003 (FR-002) — Bằng chứng private theo ticket owner; hiện tiến độ upload và timeline return, không dùng public URL tĩnh.
- [ ] T004 (FR-003) — Dùng upload chung ở FE-38 với purpose bằng chứng.
- [ ] T005 (FR-004) — Theo dõi được hoàn tiền liên quan qua `GET /api/refunds/{id}`.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/returns/mine`, `GET /api/returns/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/orders/{id}/returns`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
