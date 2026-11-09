# Tasks — FE-11

- [ ] T001 Xác nhận phụ thuộc của [FE-11](../../documents/p4/frontend/fe-11.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — CSV/XLSX theo template từng resource, validate và preview không ghi dữ liệu; confirm version rõ ràng rồi mới apply.
- [ ] T003 (FR-002) — Hiển thị process progress, partial success và lỗi từng field/dòng; retry giữ Idempotency-Key, giới hạn theo contract thực tế.
- [ ] T004 (FR-003) — Dùng upload/process chung, không đóng modal rồi mất job đang chạy; liên kết result/download và phân biệt lỗi upload với lỗi dữ liệu.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/admin/import-templates/{resource}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Nối form hoặc action cho `POST /api/admin/imports/{resource}`, `POST /api/processes/{id}/confirm`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T008 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
