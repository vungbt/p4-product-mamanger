# Nghiệm thu — FE-41 · Quản lý bảng size

[Task nguồn](../../../documents/p4/frontend/fe-41.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Tạo và sửa bảng size với nhiều dòng; mỗi dòng có `size` và các số đo lớn hơn 0, tối đa 1000.
- [ ] AC-002 (FR-002) — Giới hạn 1–100 dòng, lỗi `measurements` hiển thị rõ tại form.
- [ ] AC-003 (FR-003) — Sửa gửi `expectedVersion`; 409 cho tải lại mà không mất nội dung đang nhập.
- [ ] AC-004 (FR-004) — Gán được bảng size từ form sản phẩm ở FE-04.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/size-guides` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/admin/size-guides` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `GET /api/admin/size-guides/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `PATCH /api/admin/size-guides/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo bảng size rồi chọn bảng trong form sản phẩm. Reload và mở sản phẩm để kiểm tra bảng đã liên kết. Sửa với version cũ hiển thị lỗi nếu API yêu cầu version.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
