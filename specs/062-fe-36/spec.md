# Spec — FE-36 · Nghiệm thu xuyên Admin và Storefront

Nguồn [FE-36](../../documents/p4/frontend/fe-36.md) · Portal **Chung** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện nghiệm thu xuyên admin và storefront theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/p4/frontend/fe-01.md), [FE-37](../../documents/p4/frontend/fe-37.md), [FE-39](../../documents/p4/frontend/fe-39.md), [FE-62](../../documents/p4/frontend/fe-62.md), [FE-40](../../documents/p4/frontend/fe-40.md), [FE-08](../../documents/p4/frontend/fe-08.md), [FE-10](../../documents/p4/frontend/fe-10.md), [FE-38](../../documents/p4/frontend/fe-38.md), [FE-09](../../documents/p4/frontend/fe-09.md), [FE-46](../../documents/p4/frontend/fe-46.md), [FE-45](../../documents/p4/frontend/fe-45.md), [FE-32](../../documents/p4/frontend/fe-32.md), [FE-47](../../documents/p4/frontend/fe-47.md), [FE-60](../../documents/p4/frontend/fe-60.md), [FE-41](../../documents/p4/frontend/fe-41.md), [FE-02](../../documents/p4/frontend/fe-02.md), [FE-03](../../documents/p4/frontend/fe-03.md), [FE-04](../../documents/p4/frontend/fe-04.md), [FE-05](../../documents/p4/frontend/fe-05.md), [FE-42](../../documents/p4/frontend/fe-42.md), [FE-11](../../documents/p4/frontend/fe-11.md), [FE-48](../../documents/p4/frontend/fe-48.md), [FE-13](../../documents/p4/frontend/fe-13.md), [FE-14](../../documents/p4/frontend/fe-14.md), [FE-54](../../documents/p4/frontend/fe-54.md), [FE-26](../../documents/p4/frontend/fe-26.md), [FE-53](../../documents/p4/frontend/fe-53.md), [FE-55](../../documents/p4/frontend/fe-55.md), [FE-28](../../documents/p4/frontend/fe-28.md), [FE-56](../../documents/p4/frontend/fe-56.md), [FE-57](../../documents/p4/frontend/fe-57.md), [FE-58](../../documents/p4/frontend/fe-58.md), [FE-06](../../documents/p4/frontend/fe-06.md), [FE-07](../../documents/p4/frontend/fe-07.md), [FE-43](../../documents/p4/frontend/fe-43.md), [FE-44](../../documents/p4/frontend/fe-44.md), [FE-27](../../documents/p4/frontend/fe-27.md), [FE-51](../../documents/p4/frontend/fe-51.md), [FE-52](../../documents/p4/frontend/fe-52.md), [FE-12](../../documents/p4/frontend/fe-12.md), [FE-15](../../documents/p4/frontend/fe-15.md), [FE-16](../../documents/p4/frontend/fe-16.md), [FE-17](../../documents/p4/frontend/fe-17.md), [FE-18](../../documents/p4/frontend/fe-18.md), [FE-49](../../documents/p4/frontend/fe-49.md), [FE-19](../../documents/p4/frontend/fe-19.md), [FE-20](../../documents/p4/frontend/fe-20.md), [FE-21](../../documents/p4/frontend/fe-21.md), [FE-50](../../documents/p4/frontend/fe-50.md), [FE-22](../../documents/p4/frontend/fe-22.md), [FE-23](../../documents/p4/frontend/fe-23.md), [FE-24](../../documents/p4/frontend/fe-24.md), [FE-25](../../documents/p4/frontend/fe-25.md), [FE-29](../../documents/p4/frontend/fe-29.md), [FE-30](../../documents/p4/frontend/fe-30.md), [FE-31](../../documents/p4/frontend/fe-31.md), [FE-59](../../documents/p4/frontend/fe-59.md), [FE-61](../../documents/p4/frontend/fe-61.md), [FE-33](../../documents/p4/frontend/fe-33.md), [FE-34](../../documents/p4/frontend/fe-34.md), [FE-35](../../documents/p4/frontend/fe-35.md)

## Yêu cầu

- **FR-001** — Chạy luồng product → SKU/stock → checkout → payment → nhiều kiện → return/refund/exchange từ hai tài khoản.
- **FR-002** — Kiểm tra 400/401/403/409, quyền/owner, socket disconnect, partial import, upload lỗi, double-submit và refresh giữa luồng.
- **FR-003** — Kiểm tra 375/768/1440/1920px, keyboard/focus/tooltip/i18n, loading/empty/error; ghi kết quả và lỗi còn lại.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task này dùng contract và thành phần từ các task liên quan. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
