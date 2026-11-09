# Nghiệm thu — FE-47 · Nhận lời mời nhân viên

[Task nguồn](../../../documents/frontend/fe-47.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Route public nhận link mời; kiểm tra thiếu/hết hạn/đã dùng, hiển thị lỗi và đường quay lại login Admin.
- [ ] AC-002 (FR-002) — Form tên/mật khẩu theo schema, không cho tự chọn role; role và email lấy từ lời mời đã được server kiểm tra.
- [ ] AC-003 (FR-003) — Sau accept đăng nhập bằng Better Auth, refresh capability; token không xuất hiện trong log/analytics và callback chỉ về route nội bộ.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/staff/invitations/accept` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Mở link mời với người nhận đúng, sai người và token đã dùng. Chỉ lần hợp lệ cập nhật quyền nhân viên, sau đó khôi phục phiên theo luồng FE-01.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
