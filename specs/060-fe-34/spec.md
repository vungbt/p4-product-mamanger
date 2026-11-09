# Spec — FE-34 · Tra cứu audit log

Nguồn [FE-34](../../documents/p4/frontend/fe-34.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện tra cứu audit log theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-32](../../documents/p4/frontend/fe-32.md)

## Yêu cầu

- **FR-001** — Filter actor/action/entity/date; detail requestId, thay đổi đã redact và phân trang server.
- **FR-002** — Không cho sửa log; không render secret/token; permission audit tách khỏi menu Admin thông thường.
- **FR-003** — Filter/page nằm trong URL; link từ thông báo lỗi tìm được theo `requestId`.
- **FR-004** — Thiếu quyền `audit:read` thì không thấy menu.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
