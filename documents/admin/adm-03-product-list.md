# ADM-03 — Danh sách sản phẩm

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** ADM-02; có thể bắt đầu khi phần deploy category đang chờ

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Thay placeholder bằng danh sách sản phẩm dùng API thật, có tìm kiếm, lọc danh mục và phân trang.

## API liên quan

`GET /products?page&pageSize&q&categoryId&minPrice&maxPrice&minStock&maxStock&sortBy&sortOrder`, `GET /categories`.

## Phạm vi thực hiện

- Tạo service tại `src/services/product-service.ts`; hook/state riêng trong
  feature products, không viết gọi HTTP trong page/component.
- Bảng: ảnh, tên, danh mục, giá, tồn kho và thao tác.
- Gom search, lọc danh mục, refresh và cột hiển thị trong cùng toolbar;
  nút thêm mới dễ thấy. Search debounce 300ms, Select clearable.
- Dùng pagination/meta từ API, 10/20/50 dòng; reset trang khi đổi bộ lọc.
- Lưu search/filter/page trong URL để quay lại từ tạo/sửa vẫn giữ ngữ cảnh.
- Dùng sort API theo allowlist `name`, `price`, `stock`, `createdAt`. Backend local
  đã hỗ trợ; xác nhận deploy ở endpoint đích trước khi bật UI.
- BE local đã sửa search `q` độc lập và phân trang trong DB; gallery tải riêng.
  Kiểm tra Network/query và metadata ở endpoint đích để nghiệm thu cùng UI.
- Loading, empty, no-results, retry; ảnh lỗi có fallback; giá định dạng VND.

## Điều kiện nghiệm thu

Hoàn thành khi search riêng, search + danh mục và chuyển trang đều đúng trên dữ
liệu nhiều hơn một trang. BE thay đổi cần contract test và deploy riêng.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
