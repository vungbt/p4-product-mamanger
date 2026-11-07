# Spec — FE-61 · Dashboard quản trị và trạng thái rỗng

Nguồn [FE-61](../../documents/frontend/fe-61.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện dashboard quản trị và trạng thái rỗng theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-17](../../documents/frontend/fe-17.md), [FE-18](../../documents/frontend/fe-18.md), [FE-49](../../documents/frontend/fe-49.md)

## Yêu cầu

- **FR-001** — Thay dashboard placeholder hiện có bằng KPI và blocks P4 dựa schema stats, có loading/error/empty và điều hướng đến màn liên quan.
- **FR-002** — Nhận diện định nghĩa doanh thu/hoàn tiền/tồn theo contract, không tự suy doanh thu từ số đơn hoặc paid enum.
- **FR-003** — Responsive, quyền thiếu không làm vỡ cả dashboard; analytics/report chuyên sâu ở FE-33, không làm hai bộ dữ liệu khác nhau.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 1 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
