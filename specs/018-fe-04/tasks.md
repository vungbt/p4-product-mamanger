# Tasks — FE-04

- [ ] T001 Xác nhận phụ thuộc của [FE-04](../../documents/frontend/fe-04.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Tạo/sửa tên, slug, mô tả, category, SEO, size guide; publish chỉ sau khi API cho phép.
- [ ] T003 (FR-002) — Upload nhiều ảnh qua ticket/batch process; hiển thị từng ảnh thành công/lỗi; không gắn file chưa verify.
- [ ] T004 (FR-003) — Dùng upload chung ở FE-38, không tự viết luồng upload riêng.
- [ ] T005 (FR-004) — Lỗi validate hiển thị đúng field; rời form khi còn thay đổi chưa lưu có cảnh báo.
- [ ] T006 (FR-005) — Xoá sản phẩm có xác nhận và hiển thị lỗi khi API từ chối.
- [ ] T007 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T008 Nối form hoặc action cho `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`, `POST /api/products/{id}/images`, `DELETE /api/products/{id}/images/{imageId}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
