# Spec — FE-10 · Process center và kết nối realtime

Nguồn [FE-10](../../documents/frontend/fe-10.md) · Portal **Chung** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện process center và kết nối realtime theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-01](../../documents/frontend/fe-01.md), [FE-37](../../documents/frontend/fe-37.md)

## Yêu cầu

- **FR-001** — Dùng @p4/realtime/browser + @p4/processes/browser; kết nối theo token và dọn khi logout.
- **FR-002** — Progress/version không lùi; reconnect replay + polling fallback, cancel, lỗi từng item và download hết hạn.
- **FR-003** — Dùng được từ màn import, export và upload batch mà không viết lại logic theo dõi.
- **FR-004** — File đã hết hạn hiển thị rõ, không hiện nút tải bị lỗi.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
