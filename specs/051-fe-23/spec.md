# Spec — FE-23 · Quản trị yêu cầu đổi hàng

Nguồn [FE-23](../../documents/p4/frontend/fe-23.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện quản trị yêu cầu đổi hàng theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-21](../../documents/p4/frontend/fe-21.md), [FE-22](../../documents/p4/frontend/fe-22.md)

## Yêu cầu

- **FR-001** — Approve/reject, xem return/refund/replacement liên kết; chỉ tạo đơn thay sau điều kiện kiểm hàng.
- **FR-002** — Double-click/retry không tạo hai replacement; làm rõ quote TTL và trường hợp phải duyệt lại.
- **FR-003** — Nút tạo đơn thay thế chỉ gọi được một lần; gọi lặp nhận lại cùng đơn.
- **FR-004** — Dẫn link được tới return, refund và đơn thay thế.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
