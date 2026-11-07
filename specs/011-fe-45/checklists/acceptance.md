# Nghiệm thu — FE-45 · Sổ địa chỉ và chọn địa chỉ giao hàng

[Task nguồn](../../../documents/frontend/fe-45.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Màn danh sách/thêm/sửa/xóa địa chỉ owner; chọn mặc định và trạng thái rỗng rõ ràng.
- [ ] AC-002 (FR-002) — Dùng chung address editor/selector cho tài khoản và checkout; đổi mặc định không tự sửa snapshot đơn cũ.
- [ ] AC-003 (FR-003) — Field errors, stale version và xóa địa chỉ đang chọn được xử lý; chỉ có một mặc định theo dữ liệu server.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/addresses` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/addresses` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `PUT /api/addresses/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-04 `DELETE /api/addresses/{id}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.
- [ ] API-05 `PATCH /api/addresses/{id}/default` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Đổi địa chỉ mặc định, reload và kiểm tra chỉ có một địa chỉ mặc định. Không truy cập được địa chỉ của tài khoản khác.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
