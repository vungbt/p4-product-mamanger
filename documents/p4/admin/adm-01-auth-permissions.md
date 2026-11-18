# ADM-01 — Kiểm tra phiên đăng nhập và quyền Admin

**Trạng thái:** Chưa bắt đầu

**Phụ thuộc:** Nền tảng auth hiện có

**Giai đoạn:** Admin cốt lõi

## Mục tiêu

Xác nhận và hoàn thiện auth, session và quyền truy cập trước khi triển khai các màn quản trị.

## API liên quan

`POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout`.

## Phạm vi thực hiện

- Login bằng tài khoản admin, lỗi thông tin đăng nhập hiển thị đúng.
- Tài khoản user không vào được `/admin/*`, kể cả mở URL trực tiếp.
- Reload trang con giữ đúng phiên và route; logout xoá phiên và về login.
- Access token hết hạn: refresh một lần rồi retry; refresh thất bại về login,
  không lặp request vô hạn. Các request đồng thời dùng chung lần refresh.
- API 403 hiển thị lỗi quyền phù hợp, không bị hiểu thành lỗi cần refresh.
- Kiểm tra sidebar thu gọn, breadcrumb và menu tài khoản trên mobile/desktop.

## Điều kiện nghiệm thu

Hoàn thành khi các case trên được kiểm tra và không còn lỗi chặn thao tác admin.

## Bàn giao

Ghi lại file thay đổi, kết quả kiểm tra, commit và phần còn chờ BE/deploy. Chỉ đổi
trạng thái thành **Hoàn thành** sau nghiệm thu. Áp dụng [quy ước chung](README.md#quy-ước-chung).
