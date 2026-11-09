# Spec — FE-44 · Chi tiết sản phẩm, gallery và chọn SKU

Nguồn [FE-44](../../documents/frontend/fe-44.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện chi tiết sản phẩm, gallery và chọn sku theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-07](../../documents/frontend/fe-07.md), [FE-43](../../documents/frontend/fe-43.md), [FE-41](../../documents/frontend/fe-41.md)

## Yêu cầu

- **FR-001** — Route theo slug; gallery, giá, mô tả, size guide và review summary lấy dữ liệu thật, có 404 và chuyển slug cũ đúng contract.
- **FR-002** — Chọn size/màu xác định đúng SKU, đổi ảnh/giá/available; tổ hợp không hợp lệ hoặc hết hàng không thêm giỏ.
- **FR-003** — Số lượng không vượt available, thêm giỏ chuyển đúng variant ID; keyboard/mobile hoạt động và không dùng productId thay SKU.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
