# Nghiệm thu — FE-32 · Nhân viên và phân quyền

[Task nguồn](../../../documents/p4/frontend/fe-32.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Danh sách nhân viên và vai trò theo capability, server filter/sort/page; gửi mời email theo API.
- [ ] AC-002 (FR-002) — Đổi role/status theo version, xác nhận ảnh hưởng phiên; không khóa/hạ quyền owner cuối cùng.
- [ ] AC-003 (FR-003) — Capability/menu/action cập nhật sau thay đổi quyền; không tự cấp role từ FE, kiểm thử 403 và nhân viên bị revoke phiên.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/admin/roles` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-02 `GET /api/admin/staff` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-03 `POST /api/admin/staff/invitations` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-04 `PATCH /api/admin/staff/{id}/role` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-05 `PATCH /api/admin/staff/{id}/status` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Mời nhân viên, đổi role ở một tab rồi thử gửi bản cũ ở tab khác. Xác nhận 409, ràng buộc owner cuối và phiên của nhân viên chịu ảnh hưởng theo backend.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
