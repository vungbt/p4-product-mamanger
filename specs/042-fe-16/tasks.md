# Tasks — FE-16

- [ ] T001 Xác nhận phụ thuộc của [FE-16](../../documents/p4/frontend/fe-16.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — COD và payment attempt theo provider; redirect chỉ dẫn tới màn chờ đối soát, không tự đánh dấu paid.
- [ ] T003 (FR-002) — Refresh/back/double-click không tạo charge mới; xử lý expired/failed/pending qua trạng thái API.
- [ ] T004 (FR-003) — `mock-pay` chỉ hiện khi provider là mock; không xuất hiện ở production.
- [ ] T005 (FR-004) — Kiểm chứng Stripe bằng test mode trước khi đánh dấu hoàn thành, ghi rõ nếu chưa làm được.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T007 Nối query/SDK cho `GET /api/orders/{id}/payments`, `GET /api/orders/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T008 Nối form hoặc action cho `POST /api/orders/{id}/payment-attempts`, `POST /api/payments/{id}/mock-pay`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
