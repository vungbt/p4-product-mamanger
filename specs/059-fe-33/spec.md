# Spec — FE-33 · Báo cáo doanh thu, đơn, sản phẩm và kho

Nguồn [FE-33](../../documents/frontend/fe-33.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện báo cáo doanh thu, đơn, sản phẩm và kho theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-61](../../documents/frontend/fe-61.md), [FE-50](../../documents/frontend/fe-50.md), [FE-10](../../documents/frontend/fe-10.md), [FE-48](../../documents/frontend/fe-48.md)

## Ranh giới

Báo cáo chi tiết cùng report export thuộc task này; dashboard stats được triển khai riêng ở FE-61.

## Yêu cầu

- **FR-001** — Báo cáo sales/orders/inventory/products, bộ lọc thời gian/timezone, charts/table và report export thống nhất.
- **FR-002** — Revenue/refund/net theo ledger; cảnh báo dữ liệu legacy, không suy doanh thu từ paid enum.
- **FR-003** — Khoảng thời gian/schema theo API, export202 qua process center và authenticated download; dashboard thuộc FE-61.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 7 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
