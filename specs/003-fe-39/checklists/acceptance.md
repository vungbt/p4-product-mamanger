# Nghiệm thu — FE-39 · Dữ liệu seed cho phát triển FE

[Task nguồn](../../../documents/p4/frontend/fe-39.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Sản phẩm có nhiều SKU theo size/màu: rà lại dữ liệu local tại thời điểm chạy; không dùng số lượng seed cũ làm bằng chứng. Cần đủ tổ hợp hợp lệ/hết hàng cho FE-05 và FE-44. Đi qua inventory ledger để tồn kho vẫn khớp.
- [ ] AC-002 (FR-002) — Có collection, banner, navigation và home layout: kiểm tra thiếu config/404 và thêm fixtures hợp lệ nếu chưa có.
- [ ] AC-003 (FR-003) — Có bài viết, trang, chính sách, chuyên mục và thẻ ở cả trạng thái draft và published.
- [ ] AC-004 (FR-004) — Có promotion, bảng size, mẫu thông báo, ticket hỗ trợ và yêu cầu đổi hàng mẫu.
- [ ] AC-005 (FR-005) — Seeder chạy lại không tạo trùng, không ghi đè dữ liệu do người dùng tạo và không chạy trên production.
- [ ] AC-006 (FR-006) — Chạy `commerce-audit` sau khi seed: không lệch tồn kho và không có sản phẩm thiếu SKU.

## Ca kiểm thử theo contract

- [ ] API-01 `GET /api/storefront/home` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-02 `GET /api/admin/collections` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-03 `GET /api/admin/banners` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-04 `GET /api/admin/navigation/{placement}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-05 `GET /api/admin/home-layout` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-06 `GET /api/admin/posts` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-07 `GET /api/admin/pages` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-08 `GET /api/post-categories` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-09 `GET /api/post-tags` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-10 `GET /api/policies/current` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi.
- [ ] API-11 `GET /api/admin/promotions` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-12 `GET /api/admin/size-guides` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-13 `GET /api/admin/notification-templates` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-14 `GET /api/admin/support/tickets` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-15 `GET /api/admin/exchanges` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.
- [ ] API-16 `GET /api/admin/variants` · Seed đủ hai trang; đổi trang, sort, tìm kiếm và kiểm tra tham số, dữ liệu và tổng số từ server.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Mentor chạy seed hai lần. So sánh số dòng và ID fixture, kiểm tra catalog, kho và dữ liệu nội dung mẫu qua API. Lưu kết quả commerce audit.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
