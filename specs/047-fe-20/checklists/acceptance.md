# Nghiệm thu — FE-20 · Yêu cầu trả hàng và ảnh bằng chứng

[Task nguồn](../../../documents/frontend/fe-20.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Chỉ chọn số lượng đã giao còn trong thời hạn và chưa nằm trong yêu cầu khác.
- [ ] AC-002 (FR-002) — Bằng chứng private theo ticket owner; hiện tiến độ upload và timeline return, không dùng public URL tĩnh.
- [ ] AC-003 (FR-003) — Dùng upload chung ở FE-38 với purpose bằng chứng.
- [ ] AC-004 (FR-004) — Theo dõi được hoàn tiền liên quan qua `GET /api/refunds/{id}`.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/orders/{id}/returns` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-02 `GET /api/returns/mine` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-03 `GET /api/returns/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo yêu cầu trả một phần với ảnh đã complete. Thử số lượng vượt khả năng trả và giữ draft khi API từ chối.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
