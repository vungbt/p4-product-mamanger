# Spec — FE-62 · Khung Admin, menu và điều hướng theo quyền

Nguồn [FE-62](../../documents/frontend/fe-62.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện khung admin, menu và điều hướng theo quyền theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/frontend/fe-01.md), [FE-37](../../documents/frontend/fe-37.md)

## Yêu cầu

- **FR-001** — Hoàn thiện shell/sidebar/header hiện có, menu/action theo capability, breadcrumb từ route; không lặp avatar hoặc H1 thừa.
- **FR-002** — Collapse/mobile drawer, submenu active, focus/keyboard, trang 403/404/error và điều hướng back hoạt động.
- **FR-003** — Các nhóm catalog/orders/marketing/content/customers/settings/operations có route rõ; chỉ bật menu khi màn đã sẵn sàng, không để link chết.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task này dùng contract và thành phần từ các task liên quan. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
