# Tasks — FE-50

- [ ] T001 Xác nhận phụ thuộc của [FE-50](../../documents/frontend/fe-50.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Màn list/detail refund có filter/page/sort, liên kết order/return và số tiền do server quyết định.
- [ ] T003 (FR-002) — Phân biệt pending/processing/failed/succeeded; chưa rõ kết quả phải reconcile, chỉ retry khi API cho phép.
- [ ] T004 (FR-003) — Manual COD confirmation bắt buộc reference; retry/confirm có idempotency/version theo endpoint, không báo thành công trước API.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/refunds`, `GET /api/refunds/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/orders/{id}/refunds`, `POST /api/admin/refunds/{id}/reconcile`, `POST /api/admin/refunds/{id}/retry`, `POST /api/admin/refunds/{id}/manual-confirmation`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
