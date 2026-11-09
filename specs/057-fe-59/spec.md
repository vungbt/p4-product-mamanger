# Spec — FE-59 · Inbox hỗ trợ dành cho nhân viên

Nguồn [FE-59](../../documents/p4/frontend/fe-59.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện inbox hỗ trợ dành cho nhân viên theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-31](../../documents/p4/frontend/fe-31.md), [FE-32](../../documents/p4/frontend/fe-32.md), [FE-10](../../documents/p4/frontend/fe-10.md)

## Yêu cầu

- **FR-001** — List filter/status/assignee theo query API; staff đọc, assign, trả lời hoặc thêm internal note đúng quyền.
- **FR-002** — Attachment private và tin nhắn realtime không trùng; xử lý lỗi gửi và version conflict không mất bản nháp.
- **FR-003** — Internal note không lọt sang Storefront; test cùng ticket từ cả hai tài khoản và lịch sử đã đóng.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 6 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
