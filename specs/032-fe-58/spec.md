# Spec — FE-58 · Trình biên tập bố cục trang chủ

Nguồn [FE-58](../../documents/p4/frontend/fe-58.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện trình biên tập bố cục trang chủ theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-28](../../documents/p4/frontend/fe-28.md), [FE-56](../../documents/p4/frontend/fe-56.md), [FE-57](../../documents/p4/frontend/fe-57.md)

## Yêu cầu

- **FR-001** — Sắp xếp section theo typed blocks được API hỗ trợ, chọn collection/banner đã có và bật/tắt theo contract.
- **FR-002** — Preview desktop/mobile dùng renderer public, section trống/thiếu resource có fallback; không render HTML tùy ý.
- **FR-003** — Lưu version và xử lý xung đột; đổi config phản ánh trang chủ FE-06 mà không hardcode thêm layout.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
