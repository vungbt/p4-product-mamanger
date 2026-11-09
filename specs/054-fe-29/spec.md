# Spec — FE-29 · Inbox thông báo và preferences

Nguồn [FE-29](../../documents/frontend/fe-29.md) · Portal **Chung** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện inbox thông báo và preferences theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-09](../../documents/frontend/fe-09.md), [FE-10](../../documents/frontend/fe-10.md), [FE-40](../../documents/frontend/fe-40.md)

## Yêu cầu

- **FR-001** — Bell/unread badge/inbox dùng socket + HTTP; đọc một/đọc tất cả đồng bộ nhiều tab.
- **FR-002** — Deduplicate event theo ID, refresh snapshot khi reconnect; preferences điều khiển channel và topic.
- **FR-003** — Đọc một tab cập nhật badge ở tab khác và không đếm trùng khi socket gửi lại.
- **FR-004** — Nằm trong khu tài khoản ở FE-40 cho Storefront và trên header cho Admin.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 6 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
