# Nghiệm thu — FE-58 · Trình biên tập bố cục trang chủ

[Task nguồn](../../../documents/p4/frontend/fe-58.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Sắp xếp section theo typed blocks được API hỗ trợ, chọn collection/banner đã có và bật/tắt theo contract.
- [ ] AC-002 (FR-002) — Preview desktop/mobile dùng renderer public, section trống/thiếu resource có fallback; không render HTML tùy ý.
- [ ] AC-003 (FR-003) — Lưu version và xử lý xung đột; đổi config phản ánh trang chủ FE-06 mà không hardcode thêm layout.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/home-layout` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-02 `PATCH /api/admin/home-layout` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Đổi thứ tự section và lưu. Reload editor để xác nhận thứ tự từ server; mở trang chủ public để kiểm tra dữ liệu đã xuất bản theo đúng cấu hình.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
