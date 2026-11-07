# Tasks — FE-13

- [ ] T001 Xác nhận phụ thuộc của [FE-13](../../documents/frontend/fe-13.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Form versioned shop/policy/shipping; zone, phí, miễn phí theo ngưỡng và COD rõ ràng.
- [ ] T003 (FR-002) — Không expose secret; 409 cho tải lại cấu hình thay vì ghi đè người khác.
- [ ] T004 (FR-003) — Thay đổi cấu hình phản ánh đúng ở `GET /api/shop/config` phía Storefront.
- [ ] T005 (FR-004) — Phương thức vận chuyển mới dùng được ngay ở FE-15.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/settings/shop`, `GET /api/admin/settings/commerce`, `GET /api/admin/shipping-methods`, `GET /api/admin/shipping-methods/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `PATCH /api/admin/settings/shop`, `PATCH /api/admin/settings/commerce`, `POST /api/admin/shipping-methods`, `PATCH /api/admin/shipping-methods/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
