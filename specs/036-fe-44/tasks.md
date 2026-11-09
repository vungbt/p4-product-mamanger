# Tasks — FE-44

- [ ] T001 Xác nhận phụ thuộc của [FE-44](../../documents/frontend/fe-44.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Route theo slug; gallery, giá, mô tả, size guide và review summary lấy dữ liệu thật, có 404 và chuyển slug cũ đúng contract.
- [ ] T003 (FR-002) — Chọn size/màu xác định đúng SKU, đổi ảnh/giá/available; tổ hợp không hợp lệ hoặc hết hàng không thêm giỏ.
- [ ] T004 (FR-003) — Số lượng không vượt available, thêm giỏ chuyển đúng variant ID; keyboard/mobile hoạt động và không dùng productId thay SKU.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/products/by-slug/{slug}`, `GET /api/products/{id}`, `GET /api/products/{id}/variants`, `GET /api/products/{id}/reviews`, `GET /api/products/{id}/review-summary`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
