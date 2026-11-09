# Spec — FE-32 · Nhân viên và phân quyền

Nguồn [FE-32](../../documents/p4/frontend/fe-32.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện nhân viên và phân quyền theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/p4/frontend/fe-01.md), [FE-09](../../documents/p4/frontend/fe-09.md)

## Ranh giới

Task này sở hữu staff list, role/status và gửi invitation. Route nhận mời ở FE-47, customers ở FE-60.

## Yêu cầu

- **FR-001** — Danh sách nhân viên và vai trò theo capability, server filter/sort/page; gửi mời email theo API.
- **FR-002** — Đổi role/status theo version, xác nhận ảnh hưởng phiên; không khóa/hạ quyền owner cuối cùng.
- **FR-003** — Capability/menu/action cập nhật sau thay đổi quyền; không tự cấp role từ FE, kiểm thử 403 và nhân viên bị revoke phiên.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
