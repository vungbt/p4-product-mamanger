# Nghiệm thu — FE-25 · Kiểm duyệt đánh giá

[Task nguồn](../../../documents/p4/frontend/fe-25.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Filter review trạng thái/sản phẩm; publish/hide/reply và xử lý reports theo quyền.
- [ ] AC-002 (FR-002) — Version conflict không mất nội dung; summary public chỉ phản ánh review đã publish.
- [ ] AC-003 (FR-003) — Thay đổi kiểm duyệt phản ánh đúng ở review summary public.
- [ ] AC-004 (FR-004) — Phản hồi và kiểm duyệt có quyền riêng (`review:reply`, `review:moderate`); thiếu quyền thì ẩn action.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/reviews` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/reviews/{id}/moderation` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `PUT /api/reviews/{id}/reply` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Duyệt rồi ẩn một review trong admin; trang công khai cập nhật sau khi tải lại. Nhân viên thiếu quyền kiểm duyệt không thực hiện được thao tác.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
