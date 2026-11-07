# Spec — FE-02 · Hoàn thiện danh mục ở server mode

Nguồn [FE-02](../../documents/frontend/fe-02.md) · Portal **Admin** · Trạng thái nguồn **Đã có một phần**

## Mục tiêu

Hoàn thiện hoàn thiện danh mục ở server mode theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/frontend/fe-01.md), [FE-37](../../documents/frontend/fe-37.md)

## Yêu cầu

- **FR-001** — Search debounce 300ms, filter/sort/paging gọi API; reset trang khi query đổi.
- **FR-002** — CRUD hiển thị lỗi field (kể cả trùng slug), sinh slug theo tên nhưng cho phép sửa; giữ bố cục category hiện có.
- **FR-003** — Xoá danh mục đang có sản phẩm hiển thị đúng lỗi từ API; xác nhận trước khi xoá.
- **FR-004** — Áp dụng căn giữa dọc của table cho cả mobile và desktop.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
