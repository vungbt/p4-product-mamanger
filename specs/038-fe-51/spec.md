# Spec — FE-51 · Danh sách yêu thích

Nguồn [FE-51](../../documents/frontend/fe-51.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện danh sách yêu thích theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-44](../../documents/frontend/fe-44.md), [FE-09](../../documents/frontend/fe-09.md)

## Yêu cầu

- **FR-001** — Nút yêu thích ở card/PDP và trang wishlist khu tài khoản, đồng bộ cùng query cache.
- **FR-002** — Khách được hướng dẫn login và quay lại; không giữ dữ liệu tài khoản trước khi logout/đổi user.
- **FR-003** — Sản phẩm ngừng bán/ẩn có trạng thái phù hợp; thêm/xóa pending, lỗi rollback trạng thái nếu optimistic.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 3 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
