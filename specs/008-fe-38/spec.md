# Spec — FE-38 · Upload dùng chung qua ticket

Nguồn [FE-38](../../documents/frontend/fe-38.md) · Portal **Chung** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Hoàn thiện upload dùng chung qua ticket theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

[FE-37](../../documents/frontend/fe-37.md), [FE-10](../../documents/frontend/fe-10.md)

## Yêu cầu

- **FR-001** — Một component/hook dùng chung cho upload một file và nhiều file, nhận `purpose` theo từng màn.
- **FR-002** — Hiển thị tiến độ và kết quả từng file; file lỗi không ảnh hưởng các file còn lại, retry không tạo file trùng.
- **FR-003** — Chỉ dùng file sau khi `complete` xác nhận; không gắn file chưa verify vào dữ liệu nghiệp vụ.
- **FR-004** — File riêng tư tải qua `GET /api/files/{id}/download` có xác thực, không dùng URL public tĩnh.
- **FR-005** — Chuyển các chỗ đang dùng `useUploadFile` (ký URL qua `/files/sign-upload-url`) sang ticket rồi ghi rõ phần nào còn dùng luồng cũ.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 6 operation dùng trong FE. Các operation dùng chung được liên kết theo task sở hữu. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
