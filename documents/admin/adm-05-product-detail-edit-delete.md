# ADM-05 — Chi tiết, chỉnh sửa và xoá sản phẩm

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** ADM-04

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Hoàn thiện vòng đời CRUD sản phẩm và giữ ngữ cảnh danh sách sau thao tác.

## API liên quan

`GET /products/:id`, `PUT /products/:id`, `DELETE /products/:id`.

## Phạm vi thực hiện

- View detail hiển thị dữ liệu API; xử lý loading, retry và 404.
- `/admin/products/:id/edit` tải đúng ID, prefill form; tái sử dụng editor
  của ADM-04, không nhân đôi logic validation/upload.
- Giữ ảnh cũ khi không đổi ảnh; lưu giá/tồn kho/danh mục/mô tả đúng contract.
- Ba action hiển thị trực tiếp: mắt xanh, bút vàng, thùng rác đỏ; dùng icon
  của kit, tooltip và accessible label đầy đủ.
- Xoá có xác nhận rõ tên sản phẩm; pending/error và invalidate query đúng.
- Đổi ID hoặc chuyển route không để dữ liệu form của sản phẩm trước lọt sang.
- Quay lại danh sách giữ filter/page; xử lý trang cuối sau khi xoá.

## Điều kiện nghiệm thu

Hoàn thành khi CRUD chạy xuyên suốt, lỗi không mất dữ liệu đang nhập và cache
chi tiết/danh sách đồng bộ sau mutation.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
