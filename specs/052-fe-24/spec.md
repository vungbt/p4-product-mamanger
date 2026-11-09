# Spec — FE-24 · Viết và quản lý đánh giá đã mua

Nguồn [FE-24](../../documents/p4/frontend/fe-24.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện viết và quản lý đánh giá đã mua theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-44](../../documents/p4/frontend/fe-44.md), [FE-19](../../documents/p4/frontend/fe-19.md), [FE-38](../../documents/p4/frontend/fe-38.md), [FE-40](../../documents/p4/frontend/fe-40.md)

## Ranh giới

Task này sở hữu review/reports/ảnh đánh giá. Wishlist thuộc FE-51; báo có hàng thuộc FE-52.

## Yêu cầu

- **FR-001** — Chỉ viết review cho order item được API cho phép; pending moderation chưa xuất hiện public; ảnh dùng upload chung.
- **FR-002** — Sửa/xóa/report theo endpoint hiện có và owner/capability; legacy product review không dùng để tạo mới.
- **FR-003** — Summary/reviews public refresh theo trạng thái server; không expose email khách, kiểm thử pending/rejected/published.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
