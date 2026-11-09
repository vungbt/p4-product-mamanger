# Spec — FE-11 · Import dữ liệu theo process

Nguồn [FE-11](../../documents/frontend/fe-11.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện import dữ liệu theo process theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-05](../../documents/frontend/fe-05.md), [FE-42](../../documents/frontend/fe-42.md), [FE-10](../../documents/frontend/fe-10.md)

## Ranh giới

Task này sở hữu template, upload import, preview, confirm và lỗi từng dòng. Export nằm ở FE-48; process center dùng chung FE-10.

## Yêu cầu

- **FR-001** — CSV/XLSX theo template từng resource, validate và preview không ghi dữ liệu; confirm version rõ ràng rồi mới apply.
- **FR-002** — Hiển thị process progress, partial success và lỗi từng field/dòng; retry giữ Idempotency-Key, giới hạn theo contract thực tế.
- **FR-003** — Dùng upload/process chung, không đóng modal rồi mất job đang chạy; liên kết result/download và phân biệt lỗi upload với lỗi dữ liệu.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 3 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
