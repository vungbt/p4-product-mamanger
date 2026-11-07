# Spec — FE-49 · Thu COD và đối soát thanh toán

Nguồn [FE-49](../../documents/frontend/fe-49.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện thu cod và đối soát thanh toán theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-18](../../documents/frontend/fe-18.md)

## Yêu cầu

- **FR-001** — Form thu COD gồm amount/reference, lịch sử và trạng thái thanh toán tách khỏi trạng thái kiện hàng.
- **FR-002** — Không đánh dấu paid chỉ vì delivered; reconcile hiển thị kết quả từ server, không tự tính hoặc ghi đè số tiền.
- **FR-003** — Action theo capability/state, xác nhận và idempotency; mạng lỗi/double click không thu hai lần, 409 giữ form.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
