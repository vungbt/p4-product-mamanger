# Spec — FE-45 · Sổ địa chỉ và chọn địa chỉ giao hàng

Nguồn [FE-45](../../documents/p4/frontend/fe-45.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện sổ địa chỉ và chọn địa chỉ giao hàng theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-09](../../documents/p4/frontend/fe-09.md)

## Yêu cầu

- **FR-001** — Màn danh sách/thêm/sửa/xóa địa chỉ owner; chọn mặc định và trạng thái rỗng rõ ràng.
- **FR-002** — Dùng chung address editor/selector cho tài khoản và checkout; đổi mặc định không tự sửa snapshot đơn cũ.
- **FR-003** — Field errors, stale version và xóa địa chỉ đang chọn được xử lý; chỉ có một mặc định theo dữ liệu server.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
