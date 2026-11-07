# Spec — FE-19 · Đơn mua, tracking và yêu cầu huỷ

Nguồn [FE-19](../../documents/frontend/fe-19.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện đơn mua, tracking và yêu cầu huỷ theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-16](../../documents/frontend/fe-16.md), [FE-18](../../documents/frontend/fe-18.md), [FE-49](../../documents/frontend/fe-49.md), [FE-40](../../documents/frontend/fe-40.md)

## Yêu cầu

- **FR-001** — Chỉ xem đơn owner; timeline theo từng kiện và các trạng thái tiền/đơn tách biệt.
- **FR-002** — Chọn dòng/số lượng huỷ, gửi lý do, hiển thị chờ duyệt và hoàn tiền còn pending.
- **FR-003** — Xem trạng thái hoàn tiền của đơn qua `GET /api/refunds/{id}`, không suy ra từ trạng thái đơn.
- **FR-004** — Nằm trong khu tài khoản ở FE-40; URL đơn của người khác hiện 404.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
