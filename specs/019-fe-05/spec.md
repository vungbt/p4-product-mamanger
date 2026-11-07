# Spec — FE-05 · SKU và biến thể sản phẩm

Nguồn [FE-05](../../documents/frontend/fe-05.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện sku và biến thể sản phẩm theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-04](../../documents/frontend/fe-04.md), [FE-39](../../documents/frontend/fe-39.md)

## Yêu cầu

- **FR-001** — Mỗi size/màu có SKU, giá, ảnh và trạng thái riêng; không sửa định danh SKU đã bán.
- **FR-002** — Sửa SKU không gửi `stock`, `onHand`, `reserved`: tồn kho chỉ đổi qua FE-42.
- **FR-003** — SKU trùng hiển thị lỗi đúng field; sản phẩm phải còn SKU hợp lệ thì mới publish được theo kết quả API.
- **FR-004** — Danh sách `GET /api/admin/variants` tìm và lọc phía server, dẫn về đúng sản phẩm.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
