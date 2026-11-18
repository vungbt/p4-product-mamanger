# Spec — FE-37 · Lớp gọi API và xử lý lỗi dùng chung

Nguồn [FE-37](../../documents/p4/frontend/fe-37.md) · Portal **Chung** · Trạng thái nguồn **Đã có một phần**

## Mục tiêu

Hoàn thiện lớp gọi api và xử lý lỗi dùng chung theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/p4/frontend/fe-01.md)

## Yêu cầu

- **FR-001** — `@p4/api-sdk` đã build và category hooks đã ghép. Bổ sung resource API/hooks tại SDK theo từng task; dùng chung QueryClient từ ApiQueryProvider và xóa wrapper không có logic. App không phải tự `unwrap`/invalidate cho từng mutation.
- **FR-002** — Helper `Idempotency-Key`: giữ nguyên key khi retry cùng một thao tác, tạo key mới cho ý định mới.
- **FR-003** — Xử lý thống nhất: lỗi 400 map `extensions` vào từng field của form; 401, 403, 404, 409 và 429 (theo `Retry-After`) có hiển thị rõ ràng.
- **FR-004** — Lỗi 409 version conflict có cách tải lại dữ liệu mới và không làm mất nội dung đang nhập.
- **FR-005** — Thông báo lỗi chung có kèm `X-Request-Id` để đối chiếu log.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task này dùng contract và thành phần từ các task liên quan. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
