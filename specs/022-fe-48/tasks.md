# Tasks — FE-48

- [ ] T001 Xác nhận phụ thuộc của [FE-48](../../documents/p4/frontend/fe-48.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Dialog chọn resource/định dạng/cột theo contract, mang theo filter/sort của danh sách; xác nhận phạm vi trước khi gửi.
- [ ] T003 (FR-002) — 202 mở process center, không coi đã tải xong; theo dõi progress, cancel, partial/failed và link hết hạn qua FE-10.
- [ ] T004 (FR-003) — Download có xác thực, không ghi token vào URL; thử export rỗng/vượt giới hạn, retry giữ idempotency key.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/processes/{id}/download`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/admin/exports`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
