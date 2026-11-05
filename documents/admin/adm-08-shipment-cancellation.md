# ADM-08 — Vận chuyển và huỷ đơn chờ thanh toán

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** ADM-07

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Cho admin cập nhật vận chuyển và huỷ đơn hợp lệ, thống nhất trạng thái với backend.

## API liên quan

`PATCH /orders/:id/shipment`, `POST /orders/:id/cancel`.

## Phạm vi thực hiện

- Form cập nhật carrier, tracking code và trạng thái shipment theo contract.
- Ghi rõ trạng thái hiện tại, chỉ hiển thị action hợp lệ; không gọi endpoint
  đổi order status chung vì API không có endpoint này.
- Chốt và kiểm tra chuyển trạng thái ở BE: hiện shipment chỉ kiểm tra tập
  giá trị, chưa chặn đầy đủ các chuyển trạng thái ngược. FE không thay BE kiểm tra.
- Huỷ đơn qua `/cancel` chỉ cho đơn `pending`, có xác nhận và xử lý lỗi race.
  Không dùng shipment `cancelled` để thay luồng huỷ/reservation.
- Chặn gửi trùng, thông báo lỗi cụ thể; thành công invalidate detail/list và
  dashboard/tồn kho liên quan.
- Kiểm tra `shipped` → order `shipping`, `delivered` → `completed`; thiếu
  shipment trả lỗi rõ ràng. Không tự đánh dấu đơn đã thanh toán.

## Điều kiện nghiệm thu

Hoàn thành khi UI phản ánh đúng trạng thái API sau reload và BE từ chối transition
không hợp lệ. Kiểm thử mutation bằng dữ liệu local/test.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
