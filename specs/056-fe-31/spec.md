# Spec — FE-31 · Hỗ trợ khách hàng Storefront

Nguồn [FE-31](../../documents/p4/frontend/fe-31.md) · Portal **Chung** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện hỗ trợ khách hàng storefront theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-19](../../documents/p4/frontend/fe-19.md), [FE-10](../../documents/p4/frontend/fe-10.md), [FE-38](../../documents/p4/frontend/fe-38.md)

## Ranh giới

Task này sở hữu mở ticket, danh sách mine, xem/gửi tin và đóng ticket phía khách. Inbox/assign/internal notes cho staff ở FE-59.

## Yêu cầu

- **FR-001** — Khách mở ticket gắn đơn/attachment private; list mine, detail, đọc/gửi tin và đóng theo quyền owner.
- **FR-002** — Hiển thị pending/error/retry không trùng tin khi reconnect; gửi thất bại giữ draft.
- **FR-003** — Không hiển thị internal notes/assignee nội bộ; API ID của khách khác phải bị từ chối và UI có trang lỗi đúng.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
