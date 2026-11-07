# Spec — FE-52 · Đăng ký báo có hàng

Nguồn [FE-52](../../documents/frontend/fe-52.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện đăng ký báo có hàng theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-44](../../documents/frontend/fe-44.md), [FE-09](../../documents/frontend/fe-09.md)

## Yêu cầu

- **FR-001** — PDP hết hàng cho đăng ký đúng SKU/kênh theo API; chưa verify email hướng dẫn xác minh.
- **FR-002** — Màn tài khoản xem và hủy subscription, hiển thị trạng thái server, không trùng khi bấm lại.
- **FR-003** — Không hứa thời gian có hàng hoặc giả thông báo đã gửi; xử lý sản phẩm ngừng bán và đổi phiên.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 3 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
