# Spec — FE-56 · Quản lý banner và lịch hiển thị

Nguồn [FE-56](../../documents/frontend/fe-56.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện quản lý banner và lịch hiển thị theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-28](../../documents/frontend/fe-28.md), [FE-38](../../documents/frontend/fe-38.md)

## Yêu cầu

- **FR-001** — List/editor banner có ảnh/đích đến/lịch/status theo contract; ảnh qua upload chung.
- **FR-002** — Preview responsive, alt text và liên kết HTTPS/nội bộ hợp lệ; thời gian theo timezone rồi UTC.
- **FR-003** — Version conflict giữ nội dung, public không thấy banner draft/hết lịch; không tạo action API chưa hỗ trợ.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
