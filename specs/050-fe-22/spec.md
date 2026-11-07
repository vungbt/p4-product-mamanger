# Spec — FE-22 · Đổi size/màu và đơn thay thế

Nguồn [FE-22](../../documents/frontend/fe-22.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện đổi size/màu và đơn thay thế theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-20](../../documents/frontend/fe-20.md), [FE-50](../../documents/frontend/fe-50.md)

## Yêu cầu

- **FR-001** — Chọn SKU thay thế, xem chênh lệch và luồng trả hàng; nêu rõ hoàn đơn cũ và trả tiền đơn mới độc lập.
- **FR-002** — Không thể hiện credit giả; quote hết hạn/hết hàng phải báo và yêu cầu xác nhận lại.
- **FR-003** — Chỉ chọn SKU còn hàng từ `GET /api/products/{id}/variants`.
- **FR-004** — Hiển thị hai giao dịch độc lập: hoàn tiền đơn cũ và thanh toán đơn mới.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 3 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
