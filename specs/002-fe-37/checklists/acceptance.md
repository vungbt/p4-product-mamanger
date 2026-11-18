# Nghiệm thu — FE-37 · Lớp gọi API và xử lý lỗi dùng chung

[Task nguồn](../../../documents/p4/frontend/fe-37.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — `@p4/api-sdk` đã build và category hooks đã ghép. Bổ sung resource API/hooks tại SDK theo từng task; dùng chung QueryClient từ ApiQueryProvider và xóa wrapper không có logic. App không phải tự `unwrap`/invalidate cho từng mutation.
- [ ] AC-002 (FR-002) — Helper `Idempotency-Key`: giữ nguyên key khi retry cùng một thao tác, tạo key mới cho ý định mới.
- [ ] AC-003 (FR-003) — Xử lý thống nhất: lỗi 400 map `extensions` vào từng field của form; 401, 403, 404, 409 và 429 (theo `Retry-After`) có hiển thị rõ ràng.
- [ ] AC-004 (FR-004) — Lỗi 409 version conflict có cách tải lại dữ liệu mới và không làm mất nội dung đang nhập.
- [ ] AC-005 (FR-005) — Thông báo lỗi chung có kèm `X-Request-Id` để đối chiếu log.

## Ca kiểm thử theo contract

- [ ] Xác nhận từng luồng trong yêu cầu nghiệm thu sử dụng API local qua task phụ thuộc.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Dùng category để kiểm chứng danh sách: back/forward phục hồi query, đổi filter hủy request cũ, dữ liệu phân trang theo meta. Tạo trùng slug để kiểm tra lỗi field và request ID thực tế.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
