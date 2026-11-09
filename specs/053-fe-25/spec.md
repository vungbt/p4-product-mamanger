# Spec — FE-25 · Kiểm duyệt đánh giá

Nguồn [FE-25](../../documents/p4/frontend/fe-25.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện kiểm duyệt đánh giá theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-24](../../documents/p4/frontend/fe-24.md)

## Yêu cầu

- **FR-001** — Filter review trạng thái/sản phẩm; publish/hide/reply và xử lý reports theo quyền.
- **FR-002** — Version conflict không mất nội dung; summary public chỉ phản ánh review đã publish.
- **FR-003** — Thay đổi kiểm duyệt phản ánh đúng ở review summary public.
- **FR-004** — Phản hồi và kiểm duyệt có quyền riêng (`review:reply`, `review:moderate`); thiếu quyền thì ẩn action.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 3 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
