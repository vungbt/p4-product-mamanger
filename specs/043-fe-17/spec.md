# Spec — FE-17 · Quản trị đơn và huỷ từng phần

Nguồn [FE-17](../../documents/frontend/fe-17.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện quản trị đơn và huỷ từng phần theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-15](../../documents/frontend/fe-15.md)

## Yêu cầu

- **FR-001** — Danh sách/detail có snapshot tiền, SKU, address, timeline; action theo state/capability.
- **FR-002** — Confirm/start processing/approve-reject cancellation gửi expectedVersion và idempotency; không sửa tổng tiền ở FE.
- **FR-003** — Thay màn `admin/orders` hiện có thay vì tạo màn song song.
- **FR-004** — Trạng thái đơn, thanh toán và vận chuyển hiển thị tách biệt.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 8 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
