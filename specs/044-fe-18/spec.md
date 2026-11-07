# Spec — FE-18 · Đóng gói và vận hành nhiều kiện

Nguồn [FE-18](../../documents/frontend/fe-18.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện đóng gói và vận hành nhiều kiện theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-17](../../documents/frontend/fe-17.md)

## Ranh giới

Task này chỉ sở hữu shipment/timeline và state transition. Thu COD và đối soát nằm ở FE-49.

## Yêu cầu

- **FR-001** — Phân bổ số lượng vào nhiều kiện; pack/ready/handover/deliver/fail/return/lose/cancel theo state/capability.
- **FR-002** — Không chia vượt số lượng đã đặt; validation gắn đúng dòng/SKU, action không hợp lệ có lý do.
- **FR-003** — Timeline từng kiện và đơn cập nhật bằng HTTP/realtime; retry không chuyển trạng thái hai lần; delivered không tự đồng nghĩa paid.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 12 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
