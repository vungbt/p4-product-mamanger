# ADM-02 — Hoàn thiện quản lý danh mục

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** ADM-01; deploy API category mới cho bước server mode

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Chuyển danh mục từ client mode sang API sort/filter/pagination, giữ nguyên các hành vi CRUD đã hoàn thiện.

## API liên quan

`GET /categories?page&pageSize&q&description&sortBy&sortOrder`,
`GET /categories/:id`, `POST /categories`, `PUT /categories/:id`,
`DELETE /categories/:id`.

## Phạm vi thực hiện

- Mentor deploy API category mới và xác nhận response `{ data, meta }` ở môi
  trường FE đang sử dụng. Đây là bước triển khai riêng, không tự deploy khi làm UI.
- Service list nhận query có type; query key chứa toàn bộ tham số list.
- Search debounce 300ms, filter, sort và pagination gửi query lên API;
  DataTable không lọc/sort/phân trang lại trên riêng dữ liệu một trang.
- Mặc định 10 dòng, chỉ có lựa chọn 10/20/50. Đổi search/filter/sort/page size
  reset trang; xử lý xoá dòng cuối trang không để trang rỗng ngoài phạm vi.
- Giữ CRUD, auto slug, nút tạo lại slug, clearable và lỗi field hiện có.
- BE trả lỗi trùng slug vào field `slug` thay vì lỗi chung 500; cập nhật
  contract/test và map vào form, không suy đoán từ chuỗi message.
- Có loading, refresh, empty, no-results, error/retry; giữ dữ liệu cũ hợp lý
  khi refetch, không nháy đường viền lúc sort.

## Điều kiện nghiệm thu

Hoàn thành khi kiểm tra Network thấy tham số và metadata đúng, các trang không
trùng/mất dòng trong bộ dữ liệu ổn định, CRUD cập nhật lại danh sách/chi tiết.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
