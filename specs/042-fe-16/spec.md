# Spec — FE-16 · Thanh toán và trạng thái sau redirect

Nguồn [FE-16](../../documents/p4/frontend/fe-16.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện thanh toán và trạng thái sau redirect theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-15](../../documents/p4/frontend/fe-15.md)

## Yêu cầu

- **FR-001** — COD và payment attempt theo provider; redirect chỉ dẫn tới màn chờ đối soát, không tự đánh dấu paid.
- **FR-002** — Refresh/back/double-click không tạo charge mới; xử lý expired/failed/pending qua trạng thái API.
- **FR-003** — `mock-pay` chỉ hiện khi provider là mock; không xuất hiện ở production.
- **FR-004** — Kiểm chứng Stripe bằng test mode trước khi đánh dấu hoàn thành, ghi rõ nếu chưa làm được.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
