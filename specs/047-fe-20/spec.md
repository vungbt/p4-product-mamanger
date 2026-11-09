# Spec — FE-20 · Yêu cầu trả hàng và ảnh bằng chứng

Nguồn [FE-20](../../documents/p4/frontend/fe-20.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện yêu cầu trả hàng và ảnh bằng chứng theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-19](../../documents/p4/frontend/fe-19.md), [FE-10](../../documents/p4/frontend/fe-10.md), [FE-38](../../documents/p4/frontend/fe-38.md)

## Yêu cầu

- **FR-001** — Chỉ chọn số lượng đã giao còn trong thời hạn và chưa nằm trong yêu cầu khác.
- **FR-002** — Bằng chứng private theo ticket owner; hiện tiến độ upload và timeline return, không dùng public URL tĩnh.
- **FR-003** — Dùng upload chung ở FE-38 với purpose bằng chứng.
- **FR-004** — Theo dõi được hoàn tiền liên quan qua `GET /api/refunds/{id}`.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 3 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
