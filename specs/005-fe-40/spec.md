# Spec — FE-40 · Khung Storefront: khu tài khoản, 404 và trang lỗi

Nguồn [FE-40](../../documents/frontend/fe-40.md) · Portal **Storefront** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện khung storefront: khu tài khoản, 404 và trang lỗi theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/frontend/fe-01.md), [FE-37](../../documents/frontend/fe-37.md)

## Yêu cầu

- **FR-001** — Layout khu tài khoản có menu tới đơn mua, địa chỉ, hồ sơ, wishlist, thông báo và hỗ trợ; menu chỉ hiện mục đã có màn hình.
- **FR-002** — Route guard đưa khách chưa đăng nhập về login và quay lại đúng trang sau khi đăng nhập.
- **FR-003** — Có trang 404, trang lỗi không tải được dữ liệu và error boundary cho lỗi render, đủ VI/EN.
- **FR-004** — Thông tin shop ở header/footer lấy từ `GET /api/shop/config` thay vì viết cứng.
- **FR-005** — Điều hướng mobile dùng được bằng bàn phím và không kẹt focus.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 1 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
