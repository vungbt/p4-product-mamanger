# Spec — FE-04 · Form sản phẩm và gallery nhiều ảnh

Nguồn [FE-04](../../documents/p4/frontend/fe-04.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện form sản phẩm và gallery nhiều ảnh theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-03](../../documents/p4/frontend/fe-03.md), [FE-38](../../documents/p4/frontend/fe-38.md), [FE-41](../../documents/p4/frontend/fe-41.md)

## Yêu cầu

- **FR-001** — Tạo/sửa tên, slug, mô tả, category, SEO, size guide; publish chỉ sau khi API cho phép.
- **FR-002** — Upload nhiều ảnh qua ticket/batch process; hiển thị từng ảnh thành công/lỗi; không gắn file chưa verify.
- **FR-003** — Dùng upload chung ở FE-38, không tự viết luồng upload riêng.
- **FR-004** — Lỗi validate hiển thị đúng field; rời form khi còn thay đổi chưa lưu có cảnh báo.
- **FR-005** — Xoá sản phẩm có xác nhận và hiển thị lỗi khi API từ chối.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 5 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
