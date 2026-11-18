# ADM-12 — Quản lý hoàn tiền

**Trạng thái:** Backlog

**Phụ thuộc:** ADM-10 và chốt nghiệp vụ hoàn tiền

**Giai đoạn:** Mở rộng sau Admin cốt lõi

## Mục tiêu

Xác định contract hoàn tiền đúng trước khi triển khai màn quản lý.

## API liên quan

`GET /refunds?orderId=...`, `POST /orders/:id/refunds`.

## Phạm vi thực hiện

API hiện ghi nhận refund, restock toàn bộ và huỷ đơn; chưa gọi Stripe Refund API, kể cả khi amount nhỏ hơn toàn bộ thanh toán. Chốt cách xử lý toàn phần/một phần và trạng thái hoàn tiền thực tế với BE trước khi triển khai UI. Sau đó làm danh sách, form yêu cầu hoàn tiền, xác nhận và đồng bộ cache.

## Điều kiện nghiệm thu

Contract nghiệp vụ được thống nhất và kiểm thử; UI phản ánh đúng trạng thái hoàn tiền, không trình bày ghi nhận nội bộ thành hoàn tiền thực tế khi BE chưa hỗ trợ.

Áp dụng [quy ước chung](README.md#quy-ước-chung).
