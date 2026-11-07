# Spec — FE-55 · Preview, lịch xuất bản và lịch sử nội dung

Nguồn [FE-55](../../documents/frontend/fe-55.md) · Portal **Admin** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện preview, lịch xuất bản và lịch sử nội dung theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-26](../../documents/frontend/fe-26.md), [FE-53](../../documents/frontend/fe-53.md)

## Yêu cầu

- **FR-001** — Xem revisions read-only và thay đổi giữa các bản khi dữ liệu API đủ; không dựng restore action khi không có endpoint.
- **FR-002** — Lịch xuất bản nhập theo giờ người dùng, gửi UTC, hiển thị timezone; preview draft không public hóa dữ liệu.
- **FR-003** — SEO title/description theo schema, link an toàn và cảnh báo rời form chưa lưu; publish phản ánh đúng snapshot public.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 3 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
