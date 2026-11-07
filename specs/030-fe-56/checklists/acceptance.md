# Nghiệm thu — FE-56 · Quản lý banner và lịch hiển thị

[Task nguồn](../../../documents/frontend/fe-56.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — List/editor banner có ảnh/đích đến/lịch/status theo contract; ảnh qua upload chung.
- [ ] AC-002 (FR-002) — Preview responsive, alt text và liên kết HTTPS/nội bộ hợp lệ; thời gian theo timezone rồi UTC.
- [ ] AC-003 (FR-003) — Version conflict giữ nội dung, public không thấy banner draft/hết lịch; không tạo action API chưa hỗ trợ.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/banners` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/admin/banners` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `GET /api/admin/banners/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `PATCH /api/admin/banners/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo banner có thời điểm bắt đầu/kết thúc, kiểm tra trước, trong và sau khoảng hiệu lực. Ảnh lỗi upload giữ banner ở trạng thái có thể sửa.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
