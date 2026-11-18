# Spec — FE-28 · Quản lý bộ sưu tập sản phẩm

Nguồn [FE-28](../../documents/p4/frontend/fe-28.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện quản lý bộ sưu tập sản phẩm theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-03](../../documents/p4/frontend/fe-03.md), [FE-38](../../documents/p4/frontend/fe-38.md)

## Ranh giới

Task này sở hữu collection manual. Banner ở FE-56, menu ở FE-57, home layout ở FE-58. Không phụ thuộc trang chủ FE-06 để tránh vòng lặp.

## Yêu cầu

- **FR-001** — List/create/detail/edit manual collections và chọn sản phẩm đúng contract, version và validation.
- **FR-002** — Không đưa sản phẩm draft/archived ra public; preview danh sách theo thứ tự đã cấu hình.
- **FR-003** — Không làm banner/menu/home editor trong task này; kiểm thử missing config/404 và empty collection.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
