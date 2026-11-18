# Nghiệm thu — FE-34 · Tra cứu audit log

[Task nguồn](../../../documents/p4/frontend/fe-34.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Filter actor/action/entity/date; detail requestId, thay đổi đã redact và phân trang server.
- [ ] AC-002 (FR-002) — Không cho sửa log; không render secret/token; permission audit tách khỏi menu Admin thông thường.
- [ ] AC-003 (FR-003) — Filter/page nằm trong URL; link từ thông báo lỗi tìm được theo `requestId`.
- [ ] AC-004 (FR-004) — Thiếu quyền `audit:read` thì không thấy menu.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/audit-logs` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-02 `GET /api/admin/audit-logs/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Thực hiện một thao tác quản trị đã biết rồi tra theo actor/action/request ID. Đối chiếu log và xác nhận payload không lộ token hoặc mật khẩu.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
