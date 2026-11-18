# Spec — FE-35 · Job monitor và vận hành

Nguồn [FE-35](../../documents/p4/frontend/fe-35.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện job monitor và vận hành theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-10](../../documents/p4/frontend/fe-10.md), [FE-33](../../documents/p4/frontend/fe-33.md)

## Yêu cầu

- **FR-001** — Theo dõi pending/retry/dead letter, attempt và worker heartbeat; retry chỉ job được API cho phép.
- **FR-002** — Inventory reconciliation là hành động riêng có xác nhận; không đưa nội bộ metrics cho storefront.
- **FR-003** — Xem được từng lần chạy job kèm mã lỗi, lưu ý field `error_code`, `created_at` của attempts đang là snake_case.
- **FR-004** — Thiếu quyền `system:manage` thì ẩn retry và đối soát.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
