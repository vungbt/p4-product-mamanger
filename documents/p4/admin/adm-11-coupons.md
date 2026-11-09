# ADM-11 — Quản lý mã giảm giá

**Trạng thái:** Backlog

**Phụ thuộc:** ADM-10

**Giai đoạn:** Mở rộng sau Admin cốt lõi

## Mục tiêu

Triển khai quản lý coupon sau khi hoàn thiện Admin cốt lõi.

## API liên quan

`GET/POST /coupons`, `PUT/DELETE /coupons/:id`.

## Phạm vi thực hiện

Danh sách, tạo, sửa và xoá theo `CouponInput`; validation giá trị %, tiền, ngày hiệu lực và usage limit; map lỗi field, xác nhận xoá và invalidate cache.

## Điều kiện nghiệm thu

CRUD lưu đúng dữ liệu API; lỗi form và lỗi chung hiển thị đúng, không gửi trùng.

Áp dụng [quy ước chung](README.md#quy-ước-chung).
