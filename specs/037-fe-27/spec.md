# Spec — FE-27 · Blog, trang chính sách và nội dung public

Nguồn [FE-27](../../documents/frontend/fe-27.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện blog, trang chính sách và nội dung public theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-26](../../documents/frontend/fe-26.md), [FE-53](../../documents/frontend/fe-53.md), [FE-39](../../documents/frontend/fe-39.md), [FE-40](../../documents/frontend/fe-40.md)

## Yêu cầu

- **FR-001** — List/detail chỉ nội dung publish đúng lịch; slug redirect/404 rõ ràng.
- **FR-002** — Render typed blocks an toàn, điều hướng category/tag và policy hiện hành ở checkout/footer.
- **FR-003** — Blog và trang có title/description cho SEO từ `seoTitle`, `seoDescription`.
- **FR-004** — Slug không tồn tại dùng trang 404 ở FE-40.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 3 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
