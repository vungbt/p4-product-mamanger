# Nghiệm thu — FE-59 · Inbox hỗ trợ dành cho nhân viên

[Task nguồn](../../../documents/p4/frontend/fe-59.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — List filter/status/assignee theo query API; staff đọc, assign, trả lời hoặc thêm internal note đúng quyền.
- [ ] AC-002 (FR-002) — Attachment private và tin nhắn realtime không trùng; xử lý lỗi gửi và version conflict không mất bản nháp.
- [ ] AC-003 (FR-003) — Internal note không lọt sang Storefront; test cùng ticket từ cả hai tài khoản và lịch sử đã đóng.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/support/tickets` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `GET /api/support/tickets/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `GET /api/support/tickets/{id}/messages` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `POST /api/support/tickets/{id}/messages` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `POST /api/admin/support/tickets/{id}/assign` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-06 `POST /api/support/tickets/{id}/close` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Thêm ghi chú nội bộ và trả lời khách trong cùng ticket. Tài khoản khách thấy câu trả lời công khai và không thấy ghi chú nội bộ.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
