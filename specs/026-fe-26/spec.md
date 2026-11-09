# Spec — FE-26 · CMS bài viết

Nguồn [FE-26](../../documents/p4/frontend/fe-26.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện cms bài viết theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-04](../../documents/p4/frontend/fe-04.md), [FE-38](../../documents/p4/frontend/fe-38.md), [FE-54](../../documents/p4/frontend/fe-54.md)

## Ranh giới

Task này sở hữu post list/editor và publish/archive. Taxonomy ở FE-54, pages ở FE-53; preview/revisions/scheduling nghiệm thu riêng ở FE-55.

## Yêu cầu

- **FR-001** — Post list/editor: tên/slug, typed content, category/tag, cover và SEO theo schema; ảnh dùng upload chung.
- **FR-002** — Draft/publish/archive và version conflict không làm mất form; draft sửa không làm thay public snapshot.
- **FR-003** — Không render HTML tùy ý; lịch xuất bản và revisions được ghép/kiểm chứng qua FE-55.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
