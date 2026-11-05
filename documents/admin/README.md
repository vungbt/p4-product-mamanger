# P4 — Các task Admin

> Kế hoạch ban đầu được giữ để tham chiếu. Thứ tự mới cho cả hai portal nằm ở
> [các task Frontend](../frontend/README.md); dùng kế hoạch mới để triển khai tiếp.
> Mô tả hiện trạng bên dưới là snapshot khi tạo kế hoạch cũ, không phản ánh API local mới nhất.

Mỗi file là một task độc lập, có mục tiêu, phạm vi, phụ thuộc và điều kiện nghiệm
thu. Làm lần lượt từ **ADM-01**; chưa bắt đầu triển khai chỉ vì file task đã được tạo.

## Danh sách task

| Mã | Task | Trạng thái | Phụ thuộc |
| --- | --- | --- | --- |
| ADM-01 | [Kiểm tra phiên đăng nhập và quyền Admin](adm-01-auth-permissions.md) | Chưa bắt đầu | Nền tảng auth hiện có |
| ADM-02 | [Hoàn thiện quản lý danh mục](adm-02-category-server-mode.md) | Chưa bắt đầu | ADM-01; deploy API category mới cho bước server mode |
| ADM-03 | [Danh sách sản phẩm](adm-03-product-list.md) | Chưa bắt đầu | ADM-02; có thể bắt đầu khi phần deploy category đang chờ |
| ADM-04 | [Tạo sản phẩm](adm-04-product-create.md) | Chưa bắt đầu | ADM-03 |
| ADM-05 | [Chi tiết, chỉnh sửa và xoá sản phẩm](adm-05-product-detail-edit-delete.md) | Chưa bắt đầu | ADM-04 |
| ADM-06 | [Quản lý gallery ảnh sản phẩm](adm-06-product-gallery.md) | Chưa bắt đầu | ADM-05 |
| ADM-07 | [Danh sách và chi tiết đơn hàng](adm-07-order-list-detail.md) | Chưa bắt đầu | ADM-05 |
| ADM-08 | [Vận chuyển và huỷ đơn chờ thanh toán](adm-08-shipment-cancellation.md) | Chưa bắt đầu | ADM-07 |
| ADM-09 | [Dashboard quản trị](adm-09-dashboard.md) | Chưa bắt đầu | ADM-08 |
| ADM-10 | [Kiểm thử và nghiệm thu Admin](adm-10-admin-acceptance.md) | Chưa bắt đầu | ADM-01–09 |
| ADM-11 | [Quản lý mã giảm giá](adm-11-coupons.md) | Backlog | ADM-10 |
| ADM-12 | [Quản lý hoàn tiền](adm-12-refunds.md) | Backlog | ADM-10 và chốt nghiệp vụ hoàn tiền |

ADM-01–10 là Admin cốt lõi. ADM-11–12 là backlog mở rộng. Nếu ADM-02 chờ deploy,
có thể bắt đầu ADM-03 với CRUD danh mục hiện có; không coi server mode đã hoàn thành.
Cập nhật trạng thái trong cả file task và mục lục sau mỗi lần nghiệm thu.

## Hiện trạng khi tạo task

- Đã có nền tảng: UI kit `@itclabs/react-ui`, theme P4 Ember, sidebar/submenu,
  breadcrumb, i18n, auth và route guard.
- Danh mục đã ghép API CRUD, form validation/field errors, slug tự sinh, search
  debounce, filter clearable, các action và pagination. Search/filter/sort/paging
  hiện chạy phía client; backend đã bổ sung contract mới trên branch, chưa deploy.
- Products, Orders và Dashboard hiện là placeholder; route tạo/sửa sản phẩm chưa
  có form riêng.
- API local đã có typed query validation, sort/filter và DB pagination cho
  products, categories, orders/mine, coupons, refunds, reviews và addresses.
  Phần remote cần deploy riêng; các task frontend bên dưới chưa hoàn thành.
- Coupons và refunds có API, để sau phần Admin cốt lõi.

## Quy ước chung

- UI/page gọi hook; hook quản lý state/query/handlers; service HTTP đặt trong
  `apps/web/src/services` để tái sử dụng. Component và props/type riêng đặt cùng
  feature; không tạo wrapper/view hoặc utils folder không cần thiết.
- Dùng component, icon và theme tokens của kit; giữ các block nghiệp vụ đã có.
- Breadcrumb là tiêu đề điều hướng; chỉ thêm mô tả ngắn khi cần, tránh lặp heading.
- Action tối đa 3 nút hiển thị trực tiếp với tooltip; filter cùng toolbar;
  search/select clearable thống nhất; reset không có filter thì refresh.
- Map lỗi BE về field khi có `extensions`, lỗi chung hiện Alert/toast phù hợp.
- Mỗi task có commit riêng, ghi lại kết quả nghiệm thu. Đánh dấu hoàn thành khi
  hành vi được kiểm tra, không chỉ vì đã có code. Task BE do mentor thực hiện;
  việc deploy/release có bước riêng, không mặc định đi kèm task frontend.


Tiến độ này dành cho P4 của mentor; không thay `Training/trainee-progress.yaml`.

Nguồn: [README dự án](../../README.md), [frontend](../../apps/web/README.md),
[API](../../apps/api/README.md), [shared types](../../libs/shared/src/index.ts).
