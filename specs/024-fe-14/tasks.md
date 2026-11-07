# Tasks — FE-14

- [ ] T001 Xác nhận phụ thuộc của [FE-14](../../documents/frontend/fe-14.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — CRUD thời gian/điều kiện/quota và lịch sử redemption, soft disable giữ lịch sử.
- [ ] T003 (FR-002) — Giải thích best promotion hoặc coupon được chọn; lỗi hết quota hiển thị đúng field/form.
- [ ] T004 (FR-003) — Áp dụng quy tắc một ưu đãi mỗi đơn: coupon nhập vào thay khuyến mãi tự động.
- [ ] T005 (FR-004) — Màn chi tiết coupon lấy dữ liệu từ `GET /api/admin/coupons/{id}`.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/promotions`, `GET /api/admin/promotions/{id}`, `GET /api/coupons`, `GET /api/admin/coupons/{id}`, `GET /api/admin/coupons/{id}/redemptions`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/admin/promotions`, `PATCH /api/admin/promotions/{id}`, `POST /api/coupons`, `PUT /api/coupons/{id}`, `DELETE /api/coupons/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
