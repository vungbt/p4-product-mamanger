# Nghiệm thu — FE-55 · Preview, lịch xuất bản và lịch sử nội dung

[Task nguồn](../../../documents/frontend/fe-55.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Xem revisions read-only và thay đổi giữa các bản khi dữ liệu API đủ; không dựng restore action khi không có endpoint.
- [ ] AC-002 (FR-002) — Lịch xuất bản nhập theo giờ người dùng, gửi UTC, hiển thị timezone; preview draft không public hóa dữ liệu.
- [ ] AC-003 (FR-003) — SEO title/description theo schema, link an toàn và cảnh báo rời form chưa lưu; publish phản ánh đúng snapshot public.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/posts/{id}/revisions` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-02 `GET /api/admin/pages/{id}/revisions` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `PATCH /api/admin/posts/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Lưu một bản nháp, preview bằng tài khoản có quyền, lên lịch và đối chiếu public trước/sau mốc xuất bản. Lịch sử vẫn hiển thị revision đã lưu.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
