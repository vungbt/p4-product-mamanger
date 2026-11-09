# Spec — FE-57 · Trình biên tập menu điều hướng

Nguồn [FE-57](../../documents/frontend/fe-57.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện trình biên tập menu điều hướng theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-28](../../documents/frontend/fe-28.md), [FE-62](../../documents/frontend/fe-62.md), [FE-40](../../documents/frontend/fe-40.md)

## Yêu cầu

- **FR-001** — Editor theo placement cho header/footer và mobile; chọn target theo schema, reorder bằng kéo thả và bàn phím.
- **FR-002** — Chặn vòng lặp/độ sâu/liên kết sai theo validation API, không viết cứng menu public ở component.
- **FR-003** — Lưu version, xử lý 409, preview từng viewport và nghiệm thu navigation public sau publish theo contract.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
