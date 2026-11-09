# Spec — FE-08 · Đăng ký, xác minh và khôi phục tài khoản

Nguồn [FE-08](../../documents/frontend/fe-08.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện đăng ký, xác minh và khôi phục tài khoản theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/frontend/fe-01.md), [FE-40](../../documents/frontend/fe-40.md)

## Yêu cầu

- **FR-001** — Luồng gửi mail có thông báo trung tính; token hết hạn/đã dùng có trạng thái rõ ràng.
- **FR-002** — Không đưa token vào analytics/log; reset xong xử lý phiên bị revoke và điều hướng login.
- **FR-003** — Có màn nhận link từ email cho xác minh và đặt lại mật khẩu, kể cả khi token thiếu.
- **FR-004** — Trang đích nằm trong khung ở FE-40 và đủ VI/EN.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
