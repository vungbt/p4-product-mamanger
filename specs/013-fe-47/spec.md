# Spec — FE-47 · Nhận lời mời nhân viên

Nguồn [FE-47](../../documents/frontend/fe-47.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện nhận lời mời nhân viên theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-32](../../documents/frontend/fe-32.md), [FE-01](../../documents/frontend/fe-01.md)

## Yêu cầu

- **FR-001** — Route public nhận link mời; kiểm tra thiếu/hết hạn/đã dùng, hiển thị lỗi và đường quay lại login Admin.
- **FR-002** — Form tên/mật khẩu theo schema, không cho tự chọn role; role và email lấy từ lời mời đã được server kiểm tra.
- **FR-003** — Sau accept đăng nhập bằng Better Auth, refresh capability; token không xuất hiện trong log/analytics và callback chỉ về route nội bộ.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 1 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
