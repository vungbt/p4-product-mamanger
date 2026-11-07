# Spec — FE-50 · Quản trị hoàn tiền và xử lý lỗi provider

Nguồn [FE-50](../../documents/frontend/fe-50.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện quản trị hoàn tiền và xử lý lỗi provider theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-21](../../documents/frontend/fe-21.md), [FE-49](../../documents/frontend/fe-49.md)

## Yêu cầu

- **FR-001** — Màn list/detail refund có filter/page/sort, liên kết order/return và số tiền do server quyết định.
- **FR-002** — Phân biệt pending/processing/failed/succeeded; chưa rõ kết quả phải reconcile, chỉ retry khi API cho phép.
- **FR-003** — Manual COD confirmation bắt buộc reference; retry/confirm có idempotency/version theo endpoint, không báo thành công trước API.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 6 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
