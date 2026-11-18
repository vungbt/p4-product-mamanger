# Spec — FE-42 · Tồn kho và sổ kho

Nguồn [FE-42](../../documents/p4/frontend/fe-42.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện tồn kho và sổ kho theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-05](../../documents/p4/frontend/fe-05.md)

## Yêu cầu

- **FR-001** — Phân biệt onHand, reserved và available; lọc theo SKU phía server.
- **FR-002** — Nhập và điều chỉnh kho qua ledger, bắt buộc lý do và `Idempotency-Key`; retry không cộng kho hai lần.
- **FR-003** — Xem lịch sử biến động theo SKU và có người thao tác, thời điểm, lý do.
- **FR-004** — Màn đối soát hiển thị sai lệch từ `GET /api/admin/inventory/reconciliation` và không tự sửa số liệu.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
