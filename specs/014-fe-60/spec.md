# Spec — FE-60 · Quản trị khách hàng

Nguồn [FE-60](../../documents/frontend/fe-60.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện quản trị khách hàng theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-32](../../documents/frontend/fe-32.md)

## Yêu cầu

- **FR-001** — Màn customers riêng, server search/filter/sort/page theo contract; chỉ hiển thị thông tin được API trả.
- **FR-002** — Khóa/mở theo capability, xác nhận, lý do/version nếu schema yêu cầu; nói rõ các phiên có thể bị revoke.
- **FR-003** — Không dựng customer-detail/order-history endpoint mới từ FE; chỉ liên kết/filter đơn nếu API hỗ trợ tương ứng.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
