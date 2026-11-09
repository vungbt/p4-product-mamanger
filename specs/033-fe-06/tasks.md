# Tasks — FE-06

- [ ] T001 Xác nhận phụ thuộc của [FE-06](../../documents/p4/frontend/fe-06.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Render cấu hình publish/schedule từ API; ẩn section rỗng và sản phẩm không public.
- [ ] T003 (FR-002) — Giữ business blocks hiện có, responsive desktop/mobile và skeleton không nhảy bố cục.
- [ ] T004 (FR-003) — Thông tin shop lấy từ `GET /api/shop/config`.
- [ ] T005 (FR-004) — Không có cấu hình trang chủ thì vẫn hiển thị trạng thái hợp lý, không vỡ trang.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/storefront/home`, `GET /api/navigation/{placement}`, `GET /api/collections`, `GET /api/collections/{slug}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
