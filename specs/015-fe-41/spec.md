# Spec — FE-41 · Quản lý bảng size

Nguồn [FE-41](../../documents/p4/frontend/fe-41.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện quản lý bảng size theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-37](../../documents/p4/frontend/fe-37.md)

## Yêu cầu

- **FR-001** — Tạo và sửa bảng size với nhiều dòng; mỗi dòng có `size` và các số đo lớn hơn 0, tối đa 1000.
- **FR-002** — Giới hạn 1–100 dòng, lỗi `measurements` hiển thị rõ tại form.
- **FR-003** — Sửa gửi `expectedVersion`; 409 cho tải lại mà không mất nội dung đang nhập.
- **FR-004** — Gán được bảng size từ form sản phẩm ở FE-04.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
