# Spec — FE-21 · Duyệt và kiểm hàng trả

Nguồn [FE-21](../../documents/p4/frontend/fe-21.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện duyệt và kiểm hàng trả theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-20](../../documents/p4/frontend/fe-20.md), [FE-38](../../documents/p4/frontend/fe-38.md)

## Ranh giới

Task này sở hữu return approve/reject/receive/inspect/complete và đánh giá saleable/damaged. Luồng xử lý tiền thuộc FE-50; hiển thị link/status tích hợp thôi.

## Yêu cầu

- **FR-001** — List/detail returns, approve/reject, in-transit/receive/inspect/complete theo API và capability.
- **FR-002** — Kiểm hàng phân biệt saleable/damaged, chỉ restock sau inspection hợp lệ và đúng số lượng.
- **FR-003** — Ảnh bằng chứng private qua authenticated download; link refund và order liên quan, không tự đánh dấu tiền đã hoàn.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 8 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
