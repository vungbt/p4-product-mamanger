# ADM-06 — Quản lý gallery ảnh sản phẩm

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** ADM-05

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Cho phép thêm và xoá nhiều ảnh sản phẩm, đồng bộ ảnh đại diện và gallery với API.

## API liên quan

`POST /products/:id/images`, `DELETE /products/:id/images/:imageId`,
flow signed upload; `ProductInput.imageStorageIds` khi tạo mới.

## Phạm vi thực hiện

- Upload nhiều ảnh, preview và trạng thái upload/error riêng từng ảnh.
- Lưu public ID đúng contract, tránh thêm trùng khi retry.
- Xoá ảnh đã lưu qua API, refetch ảnh đại diện/gallery sau thay đổi.
- Phân biệt bỏ file chưa lưu và xoá ảnh đã lưu; không tự coi xoá trên UI là
  đã xoá file remote.
- Kiểm tra thứ tự `sortOrder`; chưa có endpoint reorder nên không thêm drag
  reorder giả. Nếu cần reorder, tách task API trước.

## Điều kiện nghiệm thu

Hoàn thành khi mở lại sản phẩm thấy đúng ảnh/thứ tự, không còn ảnh đã xoá trong
cache và lỗi một file không làm mất các file thành công.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
