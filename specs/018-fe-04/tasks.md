# Tasks — FE-04

- [x] T001 Xác nhận phụ thuộc của [FE-04](../../documents/p4/frontend/fe-04.md) và rà [plan](plan.md).
- [x] T002 (FR-001) — Tạo/sửa tên, slug, mô tả, category, SEO, size guide; publish chỉ sau khi API cho phép.
- [x] T003 (FR-002) — Upload nhiều ảnh qua ticket/batch process; hiển thị từng ảnh thành công/lỗi; không gắn file chưa verify.
- [x] T004 (FR-003) — Dùng upload chung ở FE-38, không tự viết luồng upload riêng.
- [x] T005 (FR-004) — Lỗi validate hiển thị đúng field; rời form khi còn thay đổi chưa lưu có cảnh báo.
- [x] T006 (FR-005) — Xoá sản phẩm có xác nhận và hiển thị lỗi khi API từ chối.
- [ ] T007 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [x] T008 Nối form hoặc action cho `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}`, `POST /api/products/{id}/images`, `DELETE /api/products/{id}/images/{imageId}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [x] T009 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.

## Bằng chứng triển khai — 2026-11-19

- T001: Đã đọc contract FE-04/FE-38, SDK và validation/service hiện hành. FE-38 được bổ sung hook dùng chung; category và size guide gọi resource hooks thật. Luồng đăng bán thuộc FE-03, không thêm nút publish vào form.
- T002–T006, T008–T009: Đã nối form, gallery, version, lỗi field và xác nhận xóa với SDK. Tồn kho chỉ gửi khi tạo. Create dùng `imageStorageIds`; edit dùng add/remove-image vì PUT hiện không xử lý mảng ảnh.
- T007 chưa hoàn tất: build/lint và 9 kiểm thử độc lập đã qua; nghiệm thu API/browser thật bị chặn bởi môi trường. Chi tiết và ánh xạ từng ca ở [acceptance.md](checklists/acceptance.md).
- Giới hạn contract: request types nhận categoryId/sizeGuideId dạng string, không nhận null. Form cho chọn/thay tham chiếu; không cung cấp xóa tham chiếu đã lưu. Không sửa backend/SDK.
