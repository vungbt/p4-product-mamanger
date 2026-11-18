# Nghiệm thu — FE-31 · Hỗ trợ khách hàng Storefront

[Task nguồn](../../../documents/p4/frontend/fe-31.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Khách mở ticket gắn đơn/attachment private; list mine, detail, đọc/gửi tin và đóng theo quyền owner.
- [ ] AC-002 (FR-002) — Hiển thị pending/error/retry không trùng tin khi reconnect; gửi thất bại giữ draft.
- [ ] AC-003 (FR-003) — Không hiển thị internal notes/assignee nội bộ; API ID của khách khác phải bị từ chối và UI có trang lỗi đúng.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/support/tickets` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `GET /api/support/tickets/mine` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Khách tạo ticket rồi gửi tin nhắn và đính kèm file đã complete. Tài khoản khác không đọc được ticket hay file của khách.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
