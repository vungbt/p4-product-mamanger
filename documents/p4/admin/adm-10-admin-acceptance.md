# ADM-10 — Kiểm thử và nghiệm thu Admin

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** ADM-01–09

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Kiểm tra toàn bộ luồng Admin cốt lõi trước khi triển khai lên môi trường đích.

## Phạm vi thực hiện

- Chạy luồng: login → category → tạo/sửa sản phẩm → gallery → xem đơn →
  cập nhật shipment/huỷ đơn hợp lệ → dashboard → logout.
- Kiểm tra 401/403/404, API lỗi/mất mạng, double submit, query cũ hoàn thành
  trễ, dữ liệu rỗng và xoá dòng cuối trang.
- Responsive desktop/mobile; không tràn ngang toàn trang, table có vùng
  cuộn phù hợp; sidebar/modal/form thao tác được bằng bàn phím.
- Tooltip, label, focus, confirm và màu action thống nhất; kiểm tra vi/en.
- Chạy `pnpm lint`, `pnpm --filter @p4/web build`,
  `pnpm --filter @p4/blocks typecheck`, `pnpm build:storybook`.
- Chạy test contract/BE liên quan và test hành vi quan trọng đã thêm; ghi
  rõ phần chưa kiểm tra. Không coi mock/model stub là kiểm thử tích hợp DB.
- Review diff, commit theo convention, cập nhật checklist và ghi các bước
  deploy BE/release UI kit còn cần thực hiện trước khi đưa FE lên môi trường đích.

## Điều kiện nghiệm thu

Hoàn thành khi không còn lỗi chặn các luồng Admin cốt lõi; storefront giữ nguyên.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
