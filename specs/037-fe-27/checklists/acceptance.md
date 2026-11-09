# Nghiệm thu — FE-27 · Blog, trang chính sách và nội dung public

[Task nguồn](../../../documents/frontend/fe-27.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — List/detail chỉ nội dung publish đúng lịch; slug redirect/404 rõ ràng.
- [ ] AC-002 (FR-002) — Render typed blocks an toàn, điều hướng category/tag và policy hiện hành ở checkout/footer.
- [ ] AC-003 (FR-003) — Blog và trang có title/description cho SEO từ `seoTitle`, `seoDescription`.
- [ ] AC-004 (FR-004) — Slug không tồn tại dùng trang 404 ở FE-40.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/posts` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `GET /api/posts/{slug}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `GET /api/pages/{slug}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Mở bài xuất bản và trang chính sách từ link trực tiếp. Slug sai hoặc draft hiển thị trạng thái 404; khách không đọc được nội dung preview quản trị.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
