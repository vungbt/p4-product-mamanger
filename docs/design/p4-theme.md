# P4 Ember

Theme sáng cho Admin và Storefront: cam thương hiệu trên nền xanh xám nhạt và bề mặt trắng.
Nguồn cấu hình duy nhất: `apps/web/src/styles/p4-theme.css`, import sau CSS của kit.
`UIProvider` giữ cấu hình icon/adapters/locale; màu đặt ở root để áp dụng cả portal.
Storybook blocks cũng import file theme này.

## Theo hướng dẫn của thư viện

Tham chiếu: [Theming](https://react-ui-one-rose.vercel.app/?path=/docs/guides-theming--docs).

- Brand cố định: CSS là nguồn cấu hình duy nhất, import sau `theme/styles.css`.
- Override public token trên `:root` để áp dụng cả menu/dialog/toast trong body portal.
- `UIProvider.theme.tokens` dành cho runtime branding; không khai báo trùng token với CSS.
- Màu tương tác được cấu hình bằng role (`hover`, `selected`, `focus`, `accent`), không đổi selector nội bộ của lib.
- `line` dùng cho phân cách; `control-border` dùng cho ranh giới control.
- `table-header` là token mở rộng của P4 qua `@theme`, không phải public token của kit.
- Thay riêng một component qua props, `classNames` hoặc `className` được hỗ trợ.
- Giữ font mặc định Be Vietnam Pro; import thêm `theme/fonts-800.css` vì các block có dùng weight 800.
- Không thay radius, kích thước control, motion hoặc z-index mặc định ở theme P4.

## Palette

| Vai trò | Màu | Cách dùng |
| --- | --- | --- |
| Brand anchor | `#ea580c` | Cam gốc của P4, token `brand-500` |
| Primary / accent | `#c2410c` | Nút chính, link, điểm nhấn; cam đậm để đọc chữ trắng |
| Selected | `#ffedd5` / `#9a3412` | Nền / chữ mục được chọn |
| Canvas | `#edf2f7` | Nền trang |
| Surface / sidebar | `#ffffff` | Bảng, card, menu, header ứng dụng |
| Table header | `#eeefec` | Token riêng `table-header` |
| Ink | `#292724` | Nội dung chính |
| Muted | `#68645f` | Mô tả, nội dung phụ |
| Line | `#e3e2dc` | Đường phân chia trang trí |
| Control border | `#8a857e` | Ranh giới input và control |
| Hover | `#f3f2ee` | Hover trung tính, không tô cam cả dòng |

Status: xanh dương thông tin, xanh lá thành công, vàng cảnh báo, đỏ lỗi.
Chart có sáu màu cam, xanh dương, teal, tím, vàng và hồng; vẫn cần nhãn/legend.

## Tích hợp component

- Sidebar: variant `bar` của kit, nền selected nhạt và thanh nhấn màu brand.
- WorkspaceHeader: `bg-surface` để tách khỏi nền trang.
- DataTable: `classNames={{ thead: 'bg-table-header text-ink' }}`.
- Hình dạng, font Be Vietnam Pro, kích thước control và motion giữ theo kit.
- IconButton: màu semantic danger/info/warning cho xóa/xem/sửa; dùng Tooltip của kit.
- Switch: `className="bg-hover-strong"` cho track tắt trên theme sidebar trắng; checked vẫn dùng accent của kit.
- Không đổi canvas cục bộ quanh bảng: các thành phần con khác cũng dùng token này.

## Kiểm tra tương phản

Tính theo độ chói tương đối sRGB. Chữ thường đạt tối thiểu 4.5:1;
ranh giới control đạt tối thiểu 3:1. Đây là kiểm tra các cặp màu được cấu hình,
không thay thế kiểm tra mọi trạng thái/opacity của component.

| Cặp token | Tương phản |
| --- | --- |
| `ink` / `surface` | 14.89:1 |
| `muted` / `surface` | 5.87:1 |
| `muted` / `canvas` | 5.21:1 |
| `on-brand` / `brand-700` | 5.18:1 |
| `brand-800` / `brand-100` | 6.38:1 |
| `control-border` / `surface` | 3.66:1 |
| `info-700` / `info-50` | 6.16:1 |
| `success-700` / `success-50` | 4.79:1 |
| `warning-700` / `warning-50` | 6.62:1 |
| `danger-700` / `danger-50` | 5.91:1 |
