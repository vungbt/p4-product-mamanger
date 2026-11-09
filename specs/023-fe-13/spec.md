# Spec — FE-13 · Cấu hình shop và vận chuyển

Nguồn [FE-13](../../documents/p4/frontend/fe-13.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện cấu hình shop và vận chuyển theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/p4/frontend/fe-01.md), [FE-37](../../documents/p4/frontend/fe-37.md)

## Yêu cầu

- **FR-001** — Form versioned shop/policy/shipping; zone, phí, miễn phí theo ngưỡng và COD rõ ràng.
- **FR-002** — Không expose secret; 409 cho tải lại cấu hình thay vì ghi đè người khác.
- **FR-003** — Thay đổi cấu hình phản ánh đúng ở `GET /api/shop/config` phía Storefront.
- **FR-004** — Phương thức vận chuyển mới dùng được ngay ở FE-15.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 8 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
