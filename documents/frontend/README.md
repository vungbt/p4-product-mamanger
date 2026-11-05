# P4 — Kế hoạch task Frontend

Mỗi file là một task riêng. Làm theo thứ tự dưới đây, xen kẽ Admin và Storefront để kiểm chứng nghiệp vụ hai chiều. Tất cả task mới đang **chưa bắt đầu**; nền tảng/category đã có được kiểm tra và bổ sung trong task tương ứng.

Thứ tự này thay kế hoạch Admin cũ; giữ [task Admin ban đầu](../admin/README.md) làm tham chiếu phạm vi, tránh triển khai trùng. API đã có implementation local; tích hợp Stripe/Cloudinary/mail thật cần môi trường test riêng trước nghiệm thu production. Không sửa API để lách quy tắc nghiệp vụ từ FE.

## Thứ tự triển khai

| Mã | Task | Portal | Phụ thuộc | Trạng thái |
| --- | --- | --- | --- | --- |
| FE-01 | [Nền tảng phiên đăng nhập và quyền](fe-01.md) | Chung | Không có | Chưa bắt đầu |
| FE-37 | [Lớp gọi API và xử lý lỗi dùng chung](fe-37.md) | Chung | FE-01 | Chưa bắt đầu |
| FE-39 | [Dữ liệu seed cho phát triển FE](fe-39.md) | API | Không có | Chưa bắt đầu |
| FE-40 | [Khung Storefront: khu tài khoản, 404 và trang lỗi](fe-40.md) | Storefront | FE-01, FE-37 | Chưa bắt đầu |
| FE-10 | [Process center và kết nối realtime](fe-10.md) | Chung | FE-01, FE-37 | Chưa bắt đầu |
| FE-38 | [Upload dùng chung qua ticket](fe-38.md) | Chung | FE-37, FE-10 | Chưa bắt đầu |
| FE-02 | [Hoàn thiện danh mục ở server mode](fe-02.md) | Admin | FE-01, FE-37 | Chưa bắt đầu |
| FE-03 | [Danh sách và chi tiết sản phẩm](fe-03.md) | Admin | FE-02 | Chưa bắt đầu |
| FE-04 | [Form sản phẩm và gallery nhiều ảnh](fe-04.md) | Admin | FE-03, FE-38, FE-41 | Chưa bắt đầu |
| FE-05 | [SKU và biến thể sản phẩm](fe-05.md) | Admin | FE-04, FE-39 | Chưa bắt đầu |
| FE-41 | [Quản lý bảng size](fe-41.md) | Admin | FE-01, FE-37 | Chưa bắt đầu |
| FE-42 | [Tồn kho và sổ kho](fe-42.md) | Admin | FE-05 | Chưa bắt đầu |
| FE-06 | [Trang chủ, menu và collection](fe-06.md) | Storefront | FE-03, FE-39, FE-40 | Chưa bắt đầu |
| FE-07 | [Catalog, tìm kiếm và chọn biến thể](fe-07.md) | Storefront | FE-05, FE-06 | Chưa bắt đầu |
| FE-08 | [Đăng ký, xác minh và khôi phục tài khoản](fe-08.md) | Storefront | FE-01, FE-40 | Chưa bắt đầu |
| FE-09 | [Profile, địa chỉ và quản lý phiên](fe-09.md) | Chung | FE-08, FE-38, FE-40 | Chưa bắt đầu |
| FE-11 | [Import và export dữ liệu](fe-11.md) | Admin | FE-05, FE-42, FE-10 | Chưa bắt đầu |
| FE-12 | [Giỏ hàng và merge sau login](fe-12.md) | Storefront | FE-07, FE-09 | Chưa bắt đầu |
| FE-13 | [Cấu hình shop và vận chuyển](fe-13.md) | Admin | FE-01, FE-37 | Chưa bắt đầu |
| FE-14 | [Promotions, coupons và quota](fe-14.md) | Admin | FE-03, FE-13 | Chưa bắt đầu |
| FE-15 | [Checkout bằng server quote](fe-15.md) | Storefront | FE-12, FE-13, FE-14 | Chưa bắt đầu |
| FE-16 | [Thanh toán và trạng thái sau redirect](fe-16.md) | Storefront | FE-15 | Chưa bắt đầu |
| FE-17 | [Quản trị đơn và huỷ từng phần](fe-17.md) | Admin | FE-15 | Chưa bắt đầu |
| FE-18 | [Vận hành nhiều kiện và COD](fe-18.md) | Admin | FE-17 | Chưa bắt đầu |
| FE-19 | [Đơn mua, tracking và yêu cầu huỷ](fe-19.md) | Storefront | FE-16, FE-18, FE-40 | Chưa bắt đầu |
| FE-20 | [Yêu cầu trả hàng và ảnh bằng chứng](fe-20.md) | Storefront | FE-19, FE-10, FE-38 | Chưa bắt đầu |
| FE-21 | [Duyệt, nhận hàng trả và hoàn tiền](fe-21.md) | Admin | FE-20, FE-38 | Chưa bắt đầu |
| FE-22 | [Đổi size/màu và đơn thay thế](fe-22.md) | Storefront | FE-20, FE-21 | Chưa bắt đầu |
| FE-23 | [Quản trị yêu cầu đổi hàng](fe-23.md) | Admin | FE-21, FE-22 | Chưa bắt đầu |
| FE-24 | [Reviews, wishlist và báo có hàng](fe-24.md) | Storefront | FE-07, FE-19, FE-38, FE-40 | Chưa bắt đầu |
| FE-25 | [Kiểm duyệt đánh giá](fe-25.md) | Admin | FE-24 | Chưa bắt đầu |
| FE-26 | [CMS bài viết, trang và taxonomy](fe-26.md) | Admin | FE-04, FE-38 | Chưa bắt đầu |
| FE-27 | [Blog, trang chính sách và nội dung public](fe-27.md) | Storefront | FE-26, FE-39 | Chưa bắt đầu |
| FE-28 | [Merchandising: collection, banner và menu](fe-28.md) | Admin | FE-06, FE-26, FE-38 | Chưa bắt đầu |
| FE-29 | [Inbox thông báo và preferences](fe-29.md) | Chung | FE-09, FE-10, FE-40 | Chưa bắt đầu |
| FE-30 | [Quản lý notification templates](fe-30.md) | Admin | FE-29 | Chưa bắt đầu |
| FE-31 | [Hỗ trợ khách hàng hai portal](fe-31.md) | Chung | FE-19, FE-10, FE-38 | Chưa bắt đầu |
| FE-32 | [Nhân viên, vai trò và khách hàng](fe-32.md) | Admin | FE-01, FE-09 | Chưa bắt đầu |
| FE-33 | [Báo cáo và dashboard từ ledger](fe-33.md) | Admin | FE-17, FE-18, FE-21, FE-10 | Chưa bắt đầu |
| FE-34 | [Tra cứu audit log](fe-34.md) | Admin | FE-32 | Chưa bắt đầu |
| FE-35 | [Job monitor và vận hành](fe-35.md) | Admin | FE-10, FE-33 | Chưa bắt đầu |
| FE-36 | [Nghiệm thu xuyên Admin và Storefront](fe-36.md) | Chung | FE-01, FE-37, FE-39, FE-40, FE-10, FE-38, FE-02, FE-03, FE-04, FE-05, FE-41, FE-42, FE-06, FE-07, FE-08, FE-09, FE-11, FE-12, FE-13, FE-14, FE-15, FE-16, FE-17, FE-18, FE-19, FE-20, FE-21, FE-22, FE-23, FE-24, FE-25, FE-26, FE-27, FE-28, FE-29, FE-30, FE-31, FE-32, FE-33, FE-34, FE-35 | Chưa bắt đầu |

## Quy ước nghiệm thu chung

- Tổ chức page/component/hook/service như code category; không thêm utils khi logic đã thuộc hook, không tách page-view chỉ để truyền nguyên bộ props.
- UI kit/icon mặc định của thư viện, theme theo config P4. Giữ business blocks đã build; không sao chép component thư viện vào dự án.
- Breadcrumb đủ định danh màn; description ngắn khi hữu ích, không thêm H1 lớn trùng tên. Content dùng chiều ngang hợp lý trên màn lớn; nền trang phân biệt table/header.
- Search/filter/reset trong cùng toolbar; tạo mới/columns có icon. Search debounce, clearable search/select đồng bộ; reset luôn hiện và refresh khi bộ lọc đã rỗng.
- Table server mode: filter/sort/page trong query key, page size tối thiểu 10. Căn giữa theo chiều dọc, không ép mọi cột căn giữa theo chiều ngang; số và thao tác căn phù hợp.
- Có 2–3 action thì hiển thị trực tiếp: trash đỏ, eye xanh, pencil vàng, có tooltip/accessible name; disabled/pending rõ ràng. Tránh dùng màu làm dấu hiệu duy nhất.
- Mutation dùng version/Idempotency-Key theo API; giữ cùng key khi retry cùng thao tác, key mới cho ý định mới. Field error hiển thị đúng trường; xử lý 401/403/409 và refresh dữ liệu bị stale.
- Socket chỉ bổ sung cập nhật; HTTP là nguồn snapshot, reconnect/polling khôi phục tiến trình. Không hiển thị dữ liệu của tài khoản trước sau khi đổi phiên.
- Mỗi task kiểm chứng desktop/mobile, bàn phím, VI/EN, pending/error/empty và quyền. Typecheck/lint/build đạt trước khi đánh dấu hoàn thành.

## Thứ tự ưu tiên

Mã task giữ nguyên để link không đổi, nên thứ tự làm theo bảng ở trên, không theo số. Làm nền trước: FE-01, FE-37, FE-39, FE-40, FE-10 và FE-38. Sau đó Admin catalog (FE-02–05, FE-41, FE-42), Storefront và tài khoản (FE-06–09), rồi import/export và chuỗi mua hàng (FE-11–18). FE-19–25 khép kín hậu mãi; FE-26–35 là nội dung, thông báo, hỗ trợ và vận hành. FE-36 nghiệm thu toàn hệ thống.

## Endpoint không có màn hình riêng

- `POST /api/payments/webhook/stripe`: Stripe gọi trực tiếp.
- `GET /health`, `GET /health/live`: dùng cho hạ tầng; `GET /health/ready` chỉ dùng khi nghiệm thu ở FE-36.
- `GET /api/admin/system/contracts`: tham khảo khi cần đối chiếu state; FE lấy type từ `@p4/shared`.
