# Nghiệm thu — FE-19 · Đơn mua, tracking và yêu cầu huỷ

[Task nguồn](../../../documents/frontend/fe-19.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Chỉ xem đơn owner; timeline theo từng kiện và các trạng thái tiền/đơn tách biệt.
- [ ] AC-002 (FR-002) — Chọn dòng/số lượng huỷ, gửi lý do, hiển thị chờ duyệt và hoàn tiền còn pending.
- [ ] AC-003 (FR-003) — Xem trạng thái hoàn tiền của đơn qua `GET /api/refunds/{id}`, không suy ra từ trạng thái đơn.
- [ ] AC-004 (FR-004) — Nằm trong khu tài khoản ở FE-40; URL đơn của người khác hiện 404.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/orders/mine` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `POST /api/orders/{id}/cancellation-requests` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Mở chi tiết và tracking của chính mình. Dùng tài khoản khác mở cùng URL, UI xử lý từ chối và không hiện snapshot cache của tài khoản trước.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
