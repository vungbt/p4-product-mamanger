# ADM-04 — Tạo sản phẩm

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** ADM-03

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Tạo sản phẩm với danh mục, giá, tồn kho, mô tả và ảnh đại diện qua signed upload.

## API liên quan

`POST /products`, `GET /categories`, `GET /files/sign-upload-url?name=...`.

## Phạm vi thực hiện

- Màn `/admin/products/new` riêng, không còn dùng placeholder danh sách.
- Form: tên, danh mục, giá, tồn kho, mô tả và ảnh đại diện theo `ProductInput`.
- Validate tên bắt buộc, giá/tồn kho theo rule BE; map lỗi BE về field,
  lỗi chung vào Alert. Disable submit khi lưu, tránh gửi trùng.
- Upload qua signed URL; giữ `publicId` từ response ký để gửi
  `imageStorageId`, không gửi URL thay public ID. Hook upload hiện chỉ trả URL,
  cần mở rộng tương thích với consumer cũ hoặc bổ sung flow riêng phù hợp.
- Preview ảnh, xoá lựa chọn chưa lưu; chặn lưu khi upload đang chạy/thất bại.
- Thành công: toast, invalidate products, quay về danh sách đúng ngữ cảnh.
- Cảnh báo rời trang khi có thay đổi chưa lưu; huỷ không tạo sản phẩm.

## Điều kiện nghiệm thu

Hoàn thành khi tạo được sản phẩm có/không có ảnh theo contract và reload vẫn thấy
đúng dữ liệu đã lưu. Không ghi thử lên production khi chưa được yêu cầu.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
