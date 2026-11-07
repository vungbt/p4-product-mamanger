# Nghiệm thu — FE-02 · Hoàn thiện danh mục ở server mode

[Task nguồn](../../../documents/frontend/fe-02.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Search debounce 300ms, filter/sort/paging gọi API; reset trang khi query đổi.
- [ ] AC-002 (FR-002) — CRUD hiển thị lỗi field (kể cả trùng slug), sinh slug theo tên nhưng cho phép sửa; giữ bố cục category hiện có.
- [ ] AC-003 (FR-003) — Xoá danh mục đang có sản phẩm hiển thị đúng lỗi từ API; xác nhận trước khi xoá.
- [ ] AC-004 (FR-004) — Áp dụng căn giữa dọc của table cho cả mobile và desktop.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/categories` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/categories` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `GET /api/categories/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `PUT /api/categories/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-05 `DELETE /api/categories/{id}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo hai danh mục cùng slug. Lần thứ hai hiển thị lỗi tại trường slug và giữ nội dung form. Chọn sort, tìm kiếm có debounce, filter mô tả và đổi trang; đối chiếu request và tổng số từ server.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
