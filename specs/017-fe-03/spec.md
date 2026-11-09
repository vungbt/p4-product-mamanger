# Spec — FE-03 · Danh sách và chi tiết sản phẩm

Nguồn [FE-03](../../documents/frontend/fe-03.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện danh sách và chi tiết sản phẩm theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-02](../../documents/frontend/fe-02.md)

## Yêu cầu

- **FR-001** — Hiển thị draft/active/inactive/archived; bộ lọc và sort phía API.
- **FR-002** — Chi tiết phân biệt thông tin sản phẩm và SKU; archive giữ dữ liệu đơn cũ, xác nhận trước thao tác.
- **FR-003** — Filter/sort/page nằm trong URL và query key; quay lại danh sách giữ nguyên bộ lọc.
- **FR-004** — Đổi trạng thái xuất bản gửi đúng version và xử lý 409.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 4 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
