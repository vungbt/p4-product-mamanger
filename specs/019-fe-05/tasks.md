# Tasks — FE-05

- [ ] T001 Xác nhận phụ thuộc của [FE-05](../../documents/p4/frontend/fe-05.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Mỗi size/màu có SKU, giá, ảnh và trạng thái riêng; không sửa định danh SKU đã bán.
- [ ] T003 (FR-002) — Sửa SKU không gửi `stock`, `onHand`, `reserved`: tồn kho chỉ đổi qua FE-42.
- [ ] T004 (FR-003) — SKU trùng hiển thị lỗi đúng field; sản phẩm phải còn SKU hợp lệ thì mới publish được theo kết quả API.
- [ ] T005 (FR-004) — Danh sách `GET /api/admin/variants` tìm và lọc phía server, dẫn về đúng sản phẩm.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/admin/variants`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/products/{id}/variants`, `PATCH /api/products/{id}/variants/{variantId}`, `PATCH /api/products/{id}/variants/{variantId}/images`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
