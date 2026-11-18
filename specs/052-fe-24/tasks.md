# Tasks — FE-24

- [ ] T001 Xác nhận phụ thuộc của [FE-24](../../documents/p4/frontend/fe-24.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Chỉ viết review cho order item được API cho phép; pending moderation chưa xuất hiện public; ảnh dùng upload chung.
- [ ] T003 (FR-002) — Sửa/xóa/report theo endpoint hiện có và owner/capability; legacy product review không dùng để tạo mới.
- [ ] T004 (FR-003) — Summary/reviews public refresh theo trạng thái server; không expose email khách, kiểm thử pending/rejected/published.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối form hoặc action cho `POST /api/order-items/{id}/reviews`, `PATCH /api/reviews/{id}`, `POST /api/reviews/{id}/reports`, `POST /api/products/{id}/reviews`, `DELETE /api/products/{id}/reviews/{reviewId}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T007 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
