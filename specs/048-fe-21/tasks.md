# Tasks — FE-21

- [ ] T001 Xác nhận phụ thuộc của [FE-21](../../documents/frontend/fe-21.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — List/detail returns, approve/reject, in-transit/receive/inspect/complete theo API và capability.
- [ ] T003 (FR-002) — Kiểm hàng phân biệt saleable/damaged, chỉ restock sau inspection hợp lệ và đúng số lượng.
- [ ] T004 (FR-003) — Ảnh bằng chứng private qua authenticated download; link refund và order liên quan, không tự đánh dấu tiền đã hoàn.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/returns`, `GET /api/files/{id}/download`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/returns/{id}/approve`, `POST /api/returns/{id}/reject`, `POST /api/returns/{id}/in-transit`, `POST /api/returns/{id}/receive`, `POST /api/returns/{id}/inspect`, `POST /api/returns/{id}/complete`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
