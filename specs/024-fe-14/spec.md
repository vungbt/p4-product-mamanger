# Spec — FE-14 · Promotions, coupons và quota

Nguồn [FE-14](../../documents/p4/frontend/fe-14.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện promotions, coupons và quota theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-03](../../documents/p4/frontend/fe-03.md), [FE-13](../../documents/p4/frontend/fe-13.md)

## Yêu cầu

- **FR-001** — CRUD thời gian/điều kiện/quota và lịch sử redemption, soft disable giữ lịch sử.
- **FR-002** — Giải thích best promotion hoặc coupon được chọn; lỗi hết quota hiển thị đúng field/form.
- **FR-003** — Áp dụng quy tắc một ưu đãi mỗi đơn: coupon nhập vào thay khuyến mãi tự động.
- **FR-004** — Màn chi tiết coupon lấy dữ liệu từ `GET /api/admin/coupons/{id}`.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 10 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
