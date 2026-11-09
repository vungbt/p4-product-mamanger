# Spec — FE-39 · Dữ liệu seed cho phát triển FE

Nguồn [FE-39](../../documents/p4/frontend/fe-39.md) · Portal **API** · Trạng thái nguồn **Chưa bắt đầu**

## Mục tiêu

Bổ sung dữ liệu local cho các nhóm đang trống để FE có dữ liệu thật khi làm và nghiệm thu. Đây là task phía API, làm trước các màn phụ thuộc.

## Phụ thuộc

Không có

## Yêu cầu

- **FR-001** — Sản phẩm có nhiều SKU theo size/màu: rà lại dữ liệu local tại thời điểm chạy; không dùng số lượng seed cũ làm bằng chứng. Cần đủ tổ hợp hợp lệ/hết hàng cho FE-05 và FE-44. Đi qua inventory ledger để tồn kho vẫn khớp.
- **FR-002** — Có collection, banner, navigation và home layout: kiểm tra thiếu config/404 và thêm fixtures hợp lệ nếu chưa có.
- **FR-003** — Có bài viết, trang, chính sách, chuyên mục và thẻ ở cả trạng thái draft và published.
- **FR-004** — Có promotion, bảng size, mẫu thông báo, ticket hỗ trợ và yêu cầu đổi hàng mẫu.
- **FR-005** — Seeder chạy lại không tạo trùng, không ghi đè dữ liệu do người dùng tạo và không chạy trên production.
- **FR-006** — Chạy `commerce-audit` sau khi seed: không lệch tồn kho và không có sản phẩm thiếu SKU.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task này dùng contract và thành phần từ các task liên quan. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
