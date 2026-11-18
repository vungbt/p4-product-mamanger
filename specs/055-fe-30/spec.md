# Spec — FE-30 · Quản lý notification templates

Nguồn [FE-30](../../documents/p4/frontend/fe-30.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện quản lý notification templates theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-29](../../documents/p4/frontend/fe-29.md)

## Yêu cầu

- **FR-001** — Chỉnh template theo allowlist biến API; preview có nội dung thiếu biến/lỗi validation.
- **FR-002** — Version conflict và quyền truy cập rõ ràng; không hiển thị credential hay token tài khoản.
- **FR-003** — Lưu mẫu gửi đúng version; lỗi thiếu biến hiển thị ngay tại form.
- **FR-004** — Thiếu quyền `notification:manage` thì chỉ xem được.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
