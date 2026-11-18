# Nghiệm thu — FE-53 · CMS trang nội dung và chính sách

[Task nguồn](../../../documents/p4/frontend/fe-53.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — List/editor pages riêng với bài viết, draft/publish/archive theo capability và version; typed blocks và preview an toàn.
- [ ] AC-002 (FR-002) — Slug, SEO và nội dung chính sách tách với cấu hình policy nghiệp vụ FE-13; checkout dùng policy current do server trả.
- [ ] AC-003 (FR-003) — Draft không làm đổi public snapshot; không có endpoint delete/restore thì không dựng nút giả.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/pages` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/admin/pages` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `GET /api/admin/pages/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `PATCH /api/admin/pages/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `POST /api/admin/pages/{id}/publish` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-06 `POST /api/admin/pages/{id}/archive` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-07 `GET /api/policies/current` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo và cập nhật trang chính sách rồi đọc bản công khai. Kiểm tra bản nháp không thay thế chính sách hiện hành trước khi được publish.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
