# Spec — FE-06 · Trang chủ, menu và collection

Nguồn [FE-06](../../documents/frontend/fe-06.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện trang chủ, menu và collection theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-03](../../documents/frontend/fe-03.md), [FE-39](../../documents/frontend/fe-39.md), [FE-40](../../documents/frontend/fe-40.md), [FE-58](../../documents/frontend/fe-58.md)

## Yêu cầu

- **FR-001** — Render cấu hình publish/schedule từ API; ẩn section rỗng và sản phẩm không public.
- **FR-002** — Giữ business blocks hiện có, responsive desktop/mobile và skeleton không nhảy bố cục.
- **FR-003** — Thông tin shop lấy từ `GET /api/shop/config`.
- **FR-004** — Không có cấu hình trang chủ thì vẫn hiển thị trạng thái hợp lý, không vỡ trang.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
