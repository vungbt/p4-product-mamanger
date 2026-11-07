# Tasks — FE-07

- [ ] T001 Xác nhận phụ thuộc của [FE-07](../../documents/frontend/fe-07.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Danh sách catalog dùng facet/filter/sort/page phía server; query key và URL đồng bộ, back/forward giữ bộ lọc.
- [ ] T003 (FR-002) — Hiển thị product cards và trạng thái không có kết quả, loading/error/retry; link tới PDP và giữ blocks hiện có.
- [ ] T004 (FR-003) — Debounce/hủy request cũ; nhận diện filter không còn hợp lệ khi category đổi; thử mobile/desktop.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/products`, `GET /api/products/facets`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
