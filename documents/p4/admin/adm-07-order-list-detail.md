# ADM-07 — Danh sách và chi tiết đơn hàng

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** ADM-05

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Triển khai màn đơn hàng và chi tiết đầy đủ dữ liệu thanh toán, giao hàng và sản phẩm.

## API liên quan

`GET /orders?page&pageSize&q&status&paymentStatus&shipmentStatus&createdFrom&createdTo&minTotal&maxTotal&sortBy&sortOrder`, `GET /orders/:id`.

## Phạm vi thực hiện

- Tạo order service dùng chung và hooks riêng feature orders.
- Bảng: mã đơn, khách hàng/email, ngày tạo, tổng tiền, trạng thái đơn,
  thanh toán và vận chuyển; action xem chi tiết.
- Search debounce, pagination 10/20/50, refresh và cột hiển thị; lưu query
  vào URL. Không lọc/sort riêng trang hiện tại rồi trình bày như toàn bộ dữ liệu.
- BE local đã hỗ trợ filter trạng thái/ngày/khoảng tiền và sort. Xác nhận
  deploy ở endpoint đích rồi ghép UI; không filter/sort lại trên một trang dữ liệu.
- Chi tiết gồm items, đơn giá/số lượng, subtotal, giảm giá, phí ship, tổng,
  địa chỉ, thanh toán và shipment. Dùng dữ liệu API, không tự tính lại số tiền.
- Phân biệt `OrderStatus`, `PaymentStatus`, `ShipmentStatus`; status có label
  i18n và màu semantic, xử lý trường null đúng.
- Loading, empty/no-results, lỗi/retry, detail 404 và direct URL.

## Điều kiện nghiệm thu

Hoàn thành khi dữ liệu list/detail thống nhất và có thể truy cập lại chi tiết
bằng URL. Có thể thêm route detail còn thiếu trong RouteConfigs.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
