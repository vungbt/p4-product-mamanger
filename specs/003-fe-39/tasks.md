# Tasks — FE-39

- [ ] T001 Xác nhận phụ thuộc của [FE-39](../../documents/p4/frontend/fe-39.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Sản phẩm có nhiều SKU theo size/màu: rà lại dữ liệu local tại thời điểm chạy; không dùng số lượng seed cũ làm bằng chứng. Cần đủ tổ hợp hợp lệ/hết hàng cho FE-05 và FE-44. Đi qua inventory ledger để tồn kho vẫn khớp.
- [ ] T003 (FR-002) — Có collection, banner, navigation và home layout: kiểm tra thiếu config/404 và thêm fixtures hợp lệ nếu chưa có.
- [ ] T004 (FR-003) — Có bài viết, trang, chính sách, chuyên mục và thẻ ở cả trạng thái draft và published.
- [ ] T005 (FR-004) — Có promotion, bảng size, mẫu thông báo, ticket hỗ trợ và yêu cầu đổi hàng mẫu.
- [ ] T006 (FR-005) — Seeder chạy lại không tạo trùng, không ghi đè dữ liệu do người dùng tạo và không chạy trên production.
- [ ] T007 (FR-006) — Chạy `commerce-audit` sau khi seed: không lệch tồn kho và không có sản phẩm thiếu SKU.
- [ ] T008 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T009 Chạy các request đọc trong plan để kiểm tra fixture sau khi seed; lưu số lượng và ID mẫu.
