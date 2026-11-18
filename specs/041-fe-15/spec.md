# Spec — FE-15 · Checkout bằng server quote

Nguồn [FE-15](../../documents/p4/frontend/fe-15.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện checkout bằng server quote theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-12](../../documents/p4/frontend/fe-12.md), [FE-13](../../documents/p4/frontend/fe-13.md), [FE-14](../../documents/p4/frontend/fe-14.md)

## Yêu cầu

- **FR-001** — Địa chỉ, phương thức giao và coupon tạo quote server; hiển thị subtotal/discount/shipping/total.
- **FR-002** — Quote hết hạn hoặc giá đổi phải xác nhận lại; submit giữ Idempotency-Key cho một ý định đặt hàng.
- **FR-003** — Đặt đơn gửi `quoteId`, không dùng luồng `items` theo `productId` cũ; gỡ code gọi luồng cũ sau khi chuyển.
- **FR-004** — Hiển thị chính sách từ `GET /api/policies/current` trước khi đặt.
- **FR-005** — Bấm đặt nhiều lần hoặc mạng lỗi rồi retry chỉ tạo một đơn.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
