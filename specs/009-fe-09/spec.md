# Spec — FE-09 · Hồ sơ và tùy chọn tài khoản

Nguồn [FE-09](../../documents/frontend/fe-09.md) · Portal **Chung** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện hồ sơ và tùy chọn tài khoản theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-08](../../documents/frontend/fe-08.md), [FE-38](../../documents/frontend/fe-38.md), [FE-40](../../documents/frontend/fe-40.md)

## Ranh giới

FE-45 sở hữu địa chỉ; FE-46 sở hữu bảo mật/phiên. Task này sở hữu profile/avatar, locale/timezone và đổi email theo luồng account nghiệp vụ hiện có.

## Yêu cầu

- **FR-001** — Xem/sửa display name, phone, avatar qua profile versioned API; preferences locale/timezone đồng bộ app.
- **FR-002** — Đổi email theo luồng account request/confirm hiện có; route callback xử lý token thiếu/hết hạn/đã dùng. Không trộn token native và compatibility.
- **FR-003** — Avatar qua upload FE-38; xử lý field error/409 và không làm mất dữ liệu nhập khi tải lại.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 6 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
