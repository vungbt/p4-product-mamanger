# Tasks — FE-43

- [ ] T001 Xác nhận phụ thuộc của [FE-43](../../documents/p4/frontend/fe-43.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Ô tìm kiếm dùng chung header/mobile, debounce từ 2 ký tự, hủy request cũ; Enter mở trang kết quả có URL chia sẻ được.
- [ ] T003 (FR-002) — Gợi ý và trang kết quả có loading/empty/error; clear, bàn phím, Escape và focus đúng; không render kết quả của từ khóa cũ.
- [ ] T004 (FR-003) — Filter/sort/page gọi server và giữ khi back/forward; không gộp task PDP vào đây.
- [ ] T005 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T006 Nối query/SDK cho `GET /api/search/suggestions`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T007 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
