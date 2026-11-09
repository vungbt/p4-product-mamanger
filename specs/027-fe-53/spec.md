# Spec — FE-53 · CMS trang nội dung và chính sách

Nguồn [FE-53](../../documents/p4/frontend/fe-53.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện cms trang nội dung và chính sách theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-26](../../documents/p4/frontend/fe-26.md), [FE-13](../../documents/p4/frontend/fe-13.md)

## Yêu cầu

- **FR-001** — List/editor pages riêng với bài viết, draft/publish/archive theo capability và version; typed blocks và preview an toàn.
- **FR-002** — Slug, SEO và nội dung chính sách tách với cấu hình policy nghiệp vụ FE-13; checkout dùng policy current do server trả.
- **FR-003** — Draft không làm đổi public snapshot; không có endpoint delete/restore thì không dựng nút giả.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 7 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
