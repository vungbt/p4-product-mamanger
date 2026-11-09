# Spec — FE-54 · Chuyên mục và thẻ bài viết

Nguồn [FE-54](../../documents/frontend/fe-54.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện chuyên mục và thẻ bài viết theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-37](../../documents/frontend/fe-37.md)

## Yêu cầu

- **FR-001** — Hai màn taxonomy list/create/edit đúng contract, slug từ tên có thể sửa, map lỗi trùng theo field.
- **FR-002** — Bộ chọn category/tag dùng lại trong editor bài viết; invalidate đúng taxonomy sau mutation.
- **FR-003** — Không thêm xóa/merge nếu API chưa có; public chỉ hiển thị taxonomy hợp lệ theo API.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 6 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
