# ADM-09 — Dashboard quản trị

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** ADM-08

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Hiển thị doanh thu, số đơn và sản phẩm tồn kho thấp theo dữ liệu API hiện có.

## API liên quan

`GET /dashboard/stats` → `totalRevenue`, `orderCount`, `lowStockProducts`.

## Phạm vi thực hiện

- Service/hook stats, query key riêng; dùng các block thống kê đã giữ lại
  trong `@p4/blocks` khi phù hợp.
- Card doanh thu, số đơn và danh sách sản phẩm tồn kho thấp, có link sang
  sản phẩm để xử lý tồn kho.
- Label đúng ý nghĩa BE: `orderCount` hiện đếm đơn paid/shipping/completed,
  không phải mọi đơn; doanh thu là tổng các đơn đó, chưa phải báo cáo kế toán.
- Không thêm chart theo ngày, tăng trưởng %, date filter hoặc KPI không có
  dữ liệu API. Các phần này là task mở rộng sau khi có contract.
- Loading, zero-data, error/retry; invalidate/refetch sau mutation liên quan.
- Bố cục responsive, mức độ nổi bật và spacing thống nhất với màn category.

## Điều kiện nghiệm thu

Hoàn thành khi số liệu khớp response API và các link điều hướng đúng.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
