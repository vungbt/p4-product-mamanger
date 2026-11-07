# Spec — FE-43 · Tìm kiếm nhanh và trang kết quả

Nguồn [FE-43](../../documents/frontend/fe-43.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện tìm kiếm nhanh và trang kết quả theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-07](../../documents/frontend/fe-07.md)

## Yêu cầu

- **FR-001** — Ô tìm kiếm dùng chung header/mobile, debounce từ 2 ký tự, hủy request cũ; Enter mở trang kết quả có URL chia sẻ được.
- **FR-002** — Gợi ý và trang kết quả có loading/empty/error; clear, bàn phím, Escape và focus đúng; không render kết quả của từ khóa cũ.
- **FR-003** — Filter/sort/page gọi server và giữ khi back/forward; không gộp task PDP vào đây.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 1 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
