# Spec — FE-46 · Bảo mật tài khoản và quản lý phiên

Nguồn [FE-46](../../documents/p4/frontend/fe-46.md) · Portal **Chung** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện bảo mật tài khoản và quản lý phiên theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/p4/frontend/fe-01.md), [FE-09](../../documents/p4/frontend/fe-09.md)

## Yêu cầu

- **FR-001** — Màn security dùng cho Admin và Storefront: thay mật khẩu, xem phiên hiện tại/thiết bị và thu hồi một/tất cả phiên khác.
- **FR-002** — Chọn một luồng native hoặc compatibility cho mỗi form; không gọi hai engine hoặc ghi token vào localStorage. Tôn trọng việc đổi mật khẩu có thể revoke phiên.
- **FR-003** — Revoke phiên đang dùng dọn cache/socket rồi login; revoke phiên khác giữ phiên hiện tại. Hiển thị thời gian/expiry theo locale, che token khỏi UI/log.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
