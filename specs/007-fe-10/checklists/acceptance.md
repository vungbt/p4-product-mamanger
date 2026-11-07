# Nghiệm thu — FE-10 · Process center và kết nối realtime

[Task nguồn](../../../documents/frontend/fe-10.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Dùng @p4/realtime/browser + @p4/processes/browser; kết nối theo token và dọn khi logout.
- [ ] AC-002 (FR-002) — Progress/version không lùi; reconnect replay + polling fallback, cancel, lỗi từng item và download hết hạn.
- [ ] AC-003 (FR-003) — Dùng được từ màn import, export và upload batch mà không viết lại logic theo dõi.
- [ ] AC-004 (FR-004) — File đã hết hạn hiển thị rõ, không hiện nút tải bị lỗi.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/processes` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `GET /api/processes/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-03 `GET /api/processes/{id}/items` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `POST /api/processes/{id}/cancel` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Bắt đầu job, ngắt kết nối rồi reconnect với offset cuối. Cập nhật replay không lặp và version cũ không ghi đè snapshot; khi socket không dùng được, polling vẫn thấy trạng thái cuối.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
