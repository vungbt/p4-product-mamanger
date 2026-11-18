# Spec — FE-48 · Export dữ liệu và tải kết quả

Nguồn [FE-48](../../documents/p4/frontend/fe-48.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện export dữ liệu và tải kết quả theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-10](../../documents/p4/frontend/fe-10.md), [FE-11](../../documents/p4/frontend/fe-11.md)

## Yêu cầu

- **FR-001** — Dialog chọn resource/định dạng/cột theo contract, mang theo filter/sort của danh sách; xác nhận phạm vi trước khi gửi.
- **FR-002** — 202 mở process center, không coi đã tải xong; theo dõi progress, cancel, partial/failed và link hết hạn qua FE-10.
- **FR-003** — Download có xác thực, không ghi token vào URL; thử export rỗng/vượt giới hạn, retry giữ idempotency key.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 2 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
