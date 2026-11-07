# Nghiệm thu — FE-54 · Chuyên mục và thẻ bài viết

[Task nguồn](../../../documents/frontend/fe-54.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Hai màn taxonomy list/create/edit đúng contract, slug từ tên có thể sửa, map lỗi trùng theo field.
- [ ] AC-002 (FR-002) — Bộ chọn category/tag dùng lại trong editor bài viết; invalidate đúng taxonomy sau mutation.
- [ ] AC-003 (FR-003) — Không thêm xóa/merge nếu API chưa có; public chỉ hiển thị taxonomy hợp lệ theo API.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/post-categories` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/admin/post-categories` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `PATCH /api/admin/post-categories/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-04 `GET /api/post-tags` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-05 `POST /api/admin/post-tags` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-06 `PATCH /api/admin/post-tags/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo chuyên mục và thẻ, lọc và sắp xếp theo contract. Kiểm tra lỗi slug trùng và trạng thái đang được tham chiếu nếu API từ chối xóa.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
