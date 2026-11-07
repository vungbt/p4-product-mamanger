# Nghiệm thu — FE-28 · Quản lý bộ sưu tập sản phẩm

[Task nguồn](../../../documents/frontend/fe-28.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — List/create/detail/edit manual collections và chọn sản phẩm đúng contract, version và validation.
- [ ] AC-002 (FR-002) — Không đưa sản phẩm draft/archived ra public; preview danh sách theo thứ tự đã cấu hình.
- [ ] AC-003 (FR-003) — Không làm banner/menu/home editor trong task này; kiểm thử missing config/404 và empty collection.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/collections` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/admin/collections` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `GET /api/admin/collections/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `PATCH /api/admin/collections/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Đổi thứ tự sản phẩm trong collection có cả sản phẩm đã publish và draft. Admin thấy thứ tự lưu; Storefront chỉ hiển thị sản phẩm đủ điều kiện.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
