# Tasks — FE-37

- [ ] T001 Xác nhận phụ thuộc của [FE-37](../../documents/frontend/fe-37.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — `@p4/api-sdk` đã build và category hooks đã ghép. Bổ sung resource API/hooks tại SDK theo từng task; dùng chung QueryClient từ ApiQueryProvider và xóa wrapper không có logic. App không phải tự `unwrap`/invalidate cho từng mutation.
- [ ] T003 (FR-002) — Helper `Idempotency-Key`: giữ nguyên key khi retry cùng một thao tác, tạo key mới cho ý định mới.
- [ ] T004 (FR-003) — Xử lý thống nhất: lỗi 400 map `extensions` vào từng field của form; 401, 403, 404, 409 và 429 (theo `Retry-After`) có hiển thị rõ ràng.
- [ ] T005 (FR-004) — Lỗi 409 version conflict có cách tải lại dữ liệu mới và không làm mất nội dung đang nhập.
- [ ] T006 (FR-005) — Thông báo lỗi chung có kèm `X-Request-Id` để đối chiếu log.
- [ ] T007 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T008 Kiểm tra các luồng trong checklist và ghi kết quả vào task nguồn.
