# Nghiệm thu — FE-26 · CMS bài viết

[Task nguồn](../../../documents/p4/frontend/fe-26.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Post list/editor: tên/slug, typed content, category/tag, cover và SEO theo schema; ảnh dùng upload chung.
- [ ] AC-002 (FR-002) — Draft/publish/archive và version conflict không làm mất form; draft sửa không làm thay public snapshot.
- [ ] AC-003 (FR-003) — Không render HTML tùy ý; lịch xuất bản và revisions được ghép/kiểm chứng qua FE-55.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/posts` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/admin/posts` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `GET /api/admin/posts/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `POST /api/admin/posts/{id}/publish` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `POST /api/admin/posts/{id}/archive` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo draft gắn chuyên mục/thẻ và ảnh đã hoàn tất upload. Public không thấy draft; khi xuất bản, mở đúng slug và kiểm tra nội dung.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
