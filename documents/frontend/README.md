# P4 — Task triển khai Admin và Storefront

62 task riêng trong folder này, làm theo **STT thực hiện** dưới đây (mã FE giữ nguyên để link cũ không hỏng). Mục tiêu bao phủ đầy đủ luồng FE của API hiện hành cho shop quần áo một cửa hàng. Đây là kế hoạch triển khai, không phải checklist và không có nghĩa các màn đã hoàn thành.

Nền tảng Better Auth, SDK và category CRUD đã có một phần từ PR #36. Các task còn lại chưa nghiệm thu; không đánh dấu hoàn thành chỉ vì có API. FE-39 là việc chuẩn bị dữ liệu local do mentor/API maintainer làm, không giao học viên sửa API. Không seed/test dữ liệu trên production.

Task Admin cũ ở [documents/admin](../admin/README.md) chỉ là tham chiếu, đã được thay bằng kế hoạch này; không triển khai song song.

## Thứ tự triển khai

| STT | Mã | Task | Portal | Phụ thuộc | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| 1 | FE-01 | [Nền tảng phiên đăng nhập và quyền](fe-01.md) | Chung | Không có | Đã có một phần |
| 2 | FE-37 | [Lớp gọi API và xử lý lỗi dùng chung](fe-37.md) | Chung | FE-01 | Đã có một phần |
| 3 | FE-39 | [Dữ liệu seed cho phát triển FE](fe-39.md) | API | Không có | Chưa bắt đầu |
| 4 | FE-62 | [Khung Admin, menu và điều hướng theo quyền](fe-62.md) | Admin | FE-01, FE-37 | Chưa bắt đầu |
| 5 | FE-40 | [Khung Storefront: khu tài khoản, 404 và trang lỗi](fe-40.md) | Storefront | FE-01, FE-37 | Chưa bắt đầu |
| 6 | FE-08 | [Đăng ký, xác minh và khôi phục tài khoản](fe-08.md) | Storefront | FE-01, FE-40 | Chưa bắt đầu |
| 7 | FE-10 | [Process center và kết nối realtime](fe-10.md) | Chung | FE-01, FE-37 | Chưa bắt đầu |
| 8 | FE-38 | [Upload dùng chung qua ticket](fe-38.md) | Chung | FE-37, FE-10 | Chưa bắt đầu |
| 9 | FE-09 | [Hồ sơ và tùy chọn tài khoản](fe-09.md) | Chung | FE-08, FE-38, FE-40 | Chưa bắt đầu |
| 10 | FE-46 | [Bảo mật tài khoản và quản lý phiên](fe-46.md) | Chung | FE-01, FE-09 | Chưa bắt đầu |
| 11 | FE-45 | [Sổ địa chỉ và chọn địa chỉ giao hàng](fe-45.md) | Storefront | FE-09 | Chưa bắt đầu |
| 12 | FE-32 | [Nhân viên và phân quyền](fe-32.md) | Admin | FE-01, FE-09 | Chưa bắt đầu |
| 13 | FE-47 | [Nhận lời mời nhân viên](fe-47.md) | Admin | FE-32, FE-01 | Chưa bắt đầu |
| 14 | FE-60 | [Quản trị khách hàng](fe-60.md) | Admin | FE-32 | Chưa bắt đầu |
| 15 | FE-41 | [Quản lý bảng size](fe-41.md) | Admin | FE-37 | Chưa bắt đầu |
| 16 | FE-02 | [Hoàn thiện danh mục ở server mode](fe-02.md) | Admin | FE-01, FE-37 | Đã có một phần |
| 17 | FE-03 | [Danh sách và chi tiết sản phẩm](fe-03.md) | Admin | FE-02 | Chưa bắt đầu |
| 18 | FE-04 | [Form sản phẩm và gallery nhiều ảnh](fe-04.md) | Admin | FE-03, FE-38, FE-41 | Chưa bắt đầu |
| 19 | FE-05 | [SKU và biến thể sản phẩm](fe-05.md) | Admin | FE-04, FE-39 | Chưa bắt đầu |
| 20 | FE-42 | [Tồn kho và sổ kho](fe-42.md) | Admin | FE-05 | Chưa bắt đầu |
| 21 | FE-11 | [Import dữ liệu theo process](fe-11.md) | Admin | FE-05, FE-42, FE-10 | Chưa bắt đầu |
| 22 | FE-48 | [Export dữ liệu và tải kết quả](fe-48.md) | Admin | FE-10, FE-11 | Chưa bắt đầu |
| 23 | FE-13 | [Cấu hình shop và vận chuyển](fe-13.md) | Admin | FE-01, FE-37 | Chưa bắt đầu |
| 24 | FE-14 | [Promotions, coupons và quota](fe-14.md) | Admin | FE-03, FE-13 | Chưa bắt đầu |
| 25 | FE-54 | [Chuyên mục và thẻ bài viết](fe-54.md) | Admin | FE-37 | Chưa bắt đầu |
| 26 | FE-26 | [CMS bài viết](fe-26.md) | Admin | FE-04, FE-38, FE-54 | Chưa bắt đầu |
| 27 | FE-53 | [CMS trang nội dung và chính sách](fe-53.md) | Admin | FE-26, FE-13 | Chưa bắt đầu |
| 28 | FE-55 | [Preview, lịch xuất bản và lịch sử nội dung](fe-55.md) | Admin | FE-26, FE-53 | Chưa bắt đầu |
| 29 | FE-28 | [Quản lý bộ sưu tập sản phẩm](fe-28.md) | Admin | FE-03, FE-38 | Chưa bắt đầu |
| 30 | FE-56 | [Quản lý banner và lịch hiển thị](fe-56.md) | Admin | FE-28, FE-38 | Chưa bắt đầu |
| 31 | FE-57 | [Trình biên tập menu điều hướng](fe-57.md) | Admin | FE-28, FE-62, FE-40 | Chưa bắt đầu |
| 32 | FE-58 | [Trình biên tập bố cục trang chủ](fe-58.md) | Admin | FE-28, FE-56, FE-57 | Chưa bắt đầu |
| 33 | FE-06 | [Trang chủ, menu và collection](fe-06.md) | Storefront | FE-03, FE-39, FE-40, FE-58 | Chưa bắt đầu |
| 34 | FE-07 | [Danh sách catalog và bộ lọc](fe-07.md) | Storefront | FE-05, FE-06 | Chưa bắt đầu |
| 35 | FE-43 | [Tìm kiếm nhanh và trang kết quả](fe-43.md) | Storefront | FE-07 | Chưa bắt đầu |
| 36 | FE-44 | [Chi tiết sản phẩm, gallery và chọn SKU](fe-44.md) | Storefront | FE-07, FE-43, FE-41 | Chưa bắt đầu |
| 37 | FE-27 | [Blog, trang chính sách và nội dung public](fe-27.md) | Storefront | FE-26, FE-53, FE-39, FE-40 | Chưa bắt đầu |
| 38 | FE-51 | [Danh sách yêu thích](fe-51.md) | Storefront | FE-44, FE-09 | Chưa bắt đầu |
| 39 | FE-52 | [Đăng ký báo có hàng](fe-52.md) | Storefront | FE-44, FE-09 | Chưa bắt đầu |
| 40 | FE-12 | [Giỏ hàng và merge sau login](fe-12.md) | Storefront | FE-44, FE-45 | Chưa bắt đầu |
| 41 | FE-15 | [Checkout bằng server quote](fe-15.md) | Storefront | FE-12, FE-13, FE-14 | Chưa bắt đầu |
| 42 | FE-16 | [Thanh toán và trạng thái sau redirect](fe-16.md) | Storefront | FE-15 | Chưa bắt đầu |
| 43 | FE-17 | [Quản trị đơn và huỷ từng phần](fe-17.md) | Admin | FE-15 | Chưa bắt đầu |
| 44 | FE-18 | [Đóng gói và vận hành nhiều kiện](fe-18.md) | Admin | FE-17 | Chưa bắt đầu |
| 45 | FE-49 | [Thu COD và đối soát thanh toán](fe-49.md) | Admin | FE-18 | Chưa bắt đầu |
| 46 | FE-19 | [Đơn mua, tracking và yêu cầu huỷ](fe-19.md) | Storefront | FE-16, FE-18, FE-49, FE-40 | Chưa bắt đầu |
| 47 | FE-20 | [Yêu cầu trả hàng và ảnh bằng chứng](fe-20.md) | Storefront | FE-19, FE-10, FE-38 | Chưa bắt đầu |
| 48 | FE-21 | [Duyệt và kiểm hàng trả](fe-21.md) | Admin | FE-20, FE-38 | Chưa bắt đầu |
| 49 | FE-50 | [Quản trị hoàn tiền và xử lý lỗi provider](fe-50.md) | Admin | FE-21, FE-49 | Chưa bắt đầu |
| 50 | FE-22 | [Đổi size/màu và đơn thay thế](fe-22.md) | Storefront | FE-20, FE-50 | Chưa bắt đầu |
| 51 | FE-23 | [Quản trị yêu cầu đổi hàng](fe-23.md) | Admin | FE-21, FE-22 | Chưa bắt đầu |
| 52 | FE-24 | [Viết và quản lý đánh giá đã mua](fe-24.md) | Storefront | FE-44, FE-19, FE-38, FE-40 | Chưa bắt đầu |
| 53 | FE-25 | [Kiểm duyệt đánh giá](fe-25.md) | Admin | FE-24 | Chưa bắt đầu |
| 54 | FE-29 | [Inbox thông báo và preferences](fe-29.md) | Chung | FE-09, FE-10, FE-40 | Chưa bắt đầu |
| 55 | FE-30 | [Quản lý notification templates](fe-30.md) | Admin | FE-29 | Chưa bắt đầu |
| 56 | FE-31 | [Hỗ trợ khách hàng Storefront](fe-31.md) | Chung | FE-19, FE-10, FE-38 | Chưa bắt đầu |
| 57 | FE-59 | [Inbox hỗ trợ dành cho nhân viên](fe-59.md) | Admin | FE-31, FE-32, FE-10 | Chưa bắt đầu |
| 58 | FE-61 | [Dashboard quản trị và trạng thái rỗng](fe-61.md) | Admin | FE-17, FE-18, FE-49 | Chưa bắt đầu |
| 59 | FE-33 | [Báo cáo doanh thu, đơn, sản phẩm và kho](fe-33.md) | Admin | FE-61, FE-50, FE-10, FE-48 | Chưa bắt đầu |
| 60 | FE-34 | [Tra cứu audit log](fe-34.md) | Admin | FE-32 | Chưa bắt đầu |
| 61 | FE-35 | [Job monitor và vận hành](fe-35.md) | Admin | FE-10, FE-33 | Chưa bắt đầu |
| 62 | FE-36 | [Nghiệm thu xuyên Admin và Storefront](fe-36.md) | Chung | Tất cả task trước | Chưa bắt đầu |

## Các mốc bàn giao

1. **Nền tảng hai portal:** phiên/quyền, SDK, Admin shell, Storefront account shell, upload/process, profile/security/address và staff. Không dựng thêm engine auth hoặc cache mới.
2. **Catalog và dữ liệu bán:** category → product → SKU → inventory, import/export, size guides, cấu hình shop và ưu đãi.
3. **Nội dung và trải nghiệm mua:** taxonomy/posts/pages, collections/banner/menu/home editor → trang chủ public → catalog/search/PDP/blog/wishlist/báo hàng. Admin tạo được dữ liệu trước khi Storefront hiển thị.
4. **Mua và vận hành:** cart → quote checkout → payment → quản trị đơn → nhiều kiện/COD → đơn mua/tracking → return/refund/exchange. Nghiệm thu từng luồng từ cả hai portal.
5. **Sau bán và vận hành:** reviews/moderation, notifications/templates, support khách/staff, dashboard/reports, audit/jobs và nghiệm thu toàn hệ thống.

## Quy ước nghiệm thu chung

- Query keys, typed API và query/mutation hooks theo resource thuộc `@p4/api-sdk`. Component gọi trực tiếp; hook cạnh page chỉ giữ logic tương tác. Không tạo `use-categories`, `use-category-details` hoặc service chỉ chuyển tiếp.
- Better Auth client qua SDK `/auth`, cookie HttpOnly; QueryClient và socket được dọn khi đổi user/logout. Không lưu token vào localStorage hoặc tự dựng refresh JWT.
- Giữ `@itclabs/react-ui`, icon/theme P4 và `@p4/blocks` đã build. Breadcrumb đủ định danh màn; không thêm H1 lớn trùng lặp; content tận dụng chiều ngang hợp lý.
- Search/filter/reset cùng toolbar; debounce, hủy request cũ, clearable đồng bộ. Reset luôn hiện, filter rỗng thì refresh. Query server có filter/sort/page trong query key và URL; page size tối thiểu 10.
- Table căn giữa dọc, cột số/action căn phù hợp. Có 2–3 action thì hiện trực tiếp: trash đỏ, eye xanh, pencil vàng; tooltip/accessible name và pending/disabled rõ.
- Version/Idempotency-Key theo từng endpoint; retry cùng ý định giữ key. Lỗi field vào field; 401/403/404/409/429 có UI rõ, không mất draft; không tự retry mutation nguy hiểm.
- Realtime bổ sung HTTP snapshot; reconnect/replay/deduplicate/polling theo contract, không đếm trùng notification hoặc tiến độ lùi. Không báo thành công chỉ vì API trả 202.
- Mỗi task có desktop/mobile, keyboard, VI/EN, loading/empty/error/retry, role/owner test và kết quả lint/build phù hợp. Provider thật (Google, mail, Stripe, Cloudinary) cần sandbox/config hợp lệ để nghiệm thu; ghi rõ nếu đang dùng mock.

## Độ bao phủ API

[API → task FE](api-coverage.md) liệt kê từng operation hiện có và task sở hữu hoặc lý do không cần màn riêng. Các endpoint webhook, health và callback nội bộ không được dựng màn CRUD giả. Tài liệu này chỉ đối chiếu phạm vi FE; tài liệu thiết kế/API chi tiết vẫn ở local theo yêu cầu.

[FE-36](fe-36.md) là cổng nghiệm thu cuối, không được bỏ qua khi các task con đã xong. API chưa hỗ trợ một thao tác thì ghi rõ blocker/đề xuất cho mentor, không dựng nút giả hay sửa API để lách nghiệp vụ.
