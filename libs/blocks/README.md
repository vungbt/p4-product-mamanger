# @p4/blocks

18 block nghiệp vụ P4 ghép từ `@itclabs/react-ui@0.10.0`. Package xuất source TypeScript;
Vite của ứng dụng build trực tiếp. Không duy trì bản sao các control của kit.

## Block được giữ

| Nhóm | Components |
| --- | --- |
| Sản phẩm | ProductCard, FlashSaleProductCard, CategoryCard, CountdownTimer |
| Checkout | AddressCard, CouponInputBar, OrderSummaryCard, PaymentMethodSelector, MobileStickyActionBar |
| Đánh giá | RatingBreakdown, ReviewCard |
| Quản trị | StatCard, StatusBreakdownList, OrderTimeline |
| Nội dung/tìm kiếm | AnnouncementBar, InfoBanner, RemovableFilterChip, SearchPill |

Logic tồn kho, giá/giảm giá, tổng tiền, callbacks, countdown, bước đơn hàng và 54 stories
được chuyển từ package cũ. Typography và trạng thái control theo kit mới, màu theo P4.
`CategoryCard.icon` nhận `IconGlyph` của kit thay cho tên icon trong registry cũ.
`CountdownTimer` được export named ở root; các props còn lại xem declaration cạnh component.

## Dùng trong web

```tsx
import { ProductCard } from '@p4/blocks';
```

Host cần `UIProvider` của kit và `I18nextProvider`. Trong CSS Tailwind 4, import
`@itclabs/react-ui/theme/styles.css`, theme ứng dụng, rồi `@p4/blocks/styles.css`.
File styles của blocks chỉ đăng ký `@source` để Tailwind quét class, không thêm reset/theme.

Import `blockResources` từ `@p4/blocks/locales`, merge `blockResources.vi` và
`blockResources.en` vào resources từng ngôn ngữ. Default namespace ứng dụng vẫn là `common`;
blocks gọi namespace `blocks` riêng. Web đã cấu hình trong `src/i18n/index.ts`.

## Các control đã thay bằng kit

| Thành phần cũ | Import trực tiếp từ `@itclabs/react-ui` |
| --- | --- |
| Button, Input, Checkbox, Radio, Tag, Avatar… | Control cùng tên (Radio dùng RadioGroup khi chọn theo nhóm) |
| ProgressBar | Progress |
| RatingStars | Rating |
| QuantitySelector | QuantityInput |
| UserChip / menu tài khoản | UserMenu |
| Header, AdminHeader, menu/layout | Navbar, WorkspaceHeader, Sidebar, WorkspaceShell |
| Icon registry nội bộ | Icon + named glyph từ `/icons/outline` hoặc `/icons/bold` |

Đọc types của kit khi đổi consumer; props của control mới có thể khác control cũ.

## Kiểm tra

```bash
pnpm storybook          # http://localhost:6006
pnpm build:storybook    # libs/blocks/storybook-static
pnpm --filter @p4/blocks typecheck
```

Storybook dùng cùng kit, palette P4 và bản dịch blocks như ứng dụng; không tải CSS cũ.
