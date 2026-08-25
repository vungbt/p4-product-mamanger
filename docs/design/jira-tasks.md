# P4 Design System — Jira Tasks

> Mỗi task = 1 component/module/page implement. Path file gợi ý đã ghi trong design system.
> Priority: P1 = dùng lặp nhiều nơi / blocking, P2 = dùng ở 2–3 page, P3 = dùng ở 1 page / nice-to-have.

---

## Epic 1: Foundation (Design Tokens + Typography)

| # | Task | Path | Priority | Notes |
|---|------|------|----------|-------|
| A1 | Setup Design Tokens CSS | `libs/ui/theme/tokens.css` | P1 | CSS custom properties: colors (primary/secondary/neutral/semantic), shadows, radius, font vars. Tailwind preset nếu dùng Tailwind. |
| A2 | Typography Scale (Tailwind preset) | `tailwind.preset.cjs` | P1 | fontSize: ui-stat, ui-h1, ui-h2, ui-h3, ui-body, ui-body-strong, ui-label, ui-caption, ui-overline, ui-mono. Font: Plus Jakarta Sans. |

---

## Epic 2: Components — `libs/ui/components/` (Single-concern)

| # | Task | Path | Priority | Notes |
|---|------|------|----------|-------|
| C1 | Button | `libs/ui/components/button/` | P1 | 5 variants (primary, secondary, subtle, error, ghost) × 3 sizes (sm/md/lg). States: default, hover, active, disabled, loading. |
| C2 | IconButton | `libs/ui/components/button/` | P1 | 40×40, shape: square/circle, badge support (notification count). |
| C3 | Input | `libs/ui/components/input/` | P1 | States: default, focus (orange ring), error. Sizes: md. Support icon-left. |
| C4 | Checkbox & Radio | `libs/ui/components/checkbox/`, `radio/` | P1 | Checked/unchecked states, primary color khi checked. |
| C5 | MobileStickyActionBar | `libs/ui/components/mobile-sticky-action-bar/` | P2 | Thanh CTA dính đáy mobile. Variants: pdp / cart / custom. Props: variant, children. |
| E1 | Tag / Badge | `libs/ui/components/tag/` | P1 | Pill shape. Variants: primary, success, error, pending, info, neutral. |
| F1 | ProductCard | `libs/ui/components/product-card/` | P1 | Card đơn: image + badge + wishlist + category + rating + name + price + stock + CTA. Variants: còn hàng / hết hàng / sale badge. |
| F2 | FlashSaleProductCard | `libs/ui/components/flash-sale-product-card/` | P2 | Badge đỏ solid (−20%) + giá gạch + progress bar "đã bán X/Y". |
| G1 | StatCard | `libs/ui/components/stat-card/` | P2 | Label + stat value + trend (up/down) + sub text. |
| G2 | StatusBreakdownList | `libs/ui/components/status-breakdown-list/` | P2 | rows[] → label + count + pct + colored progress bar. Dùng ở Dashboard. |
| H1 | CountdownTimer | `libs/ui/components/countdown-timer/` | P2 | targetDate → 4 ô (Ngày/Giờ/Phút/Giây). Props: targetDate, size, onExpire. |
| I1 | OrderTimeline | `libs/ui/components/order-timeline/` | P2 | Vertical stepper (completed/active/pending). Variant: horizontal condensed. Props: steps[], orientation. |
| J1 | QuantitySelector | `libs/ui/components/quantity-selector/` | P1 | Nút −/value/+. Min/max boundary. |
| J2 | RatingStars | `libs/ui/components/rating-stars/` | P2 | Display mode (readonly) + Input mode (clickable). Props: value, max, onChange, readOnly. |
| J3 | ReviewCard | `libs/ui/components/review-card/` | P2 | Avatar chữ cái + email + sao + ngày + comment. |
| J4 | RatingBreakdown | `libs/ui/components/rating-breakdown/` | P3 | Điểm trung bình lớn + tổng số + breakdown 5→1 sao dạng thanh ngang. |
| J6 | PaymentMethodSelector | `libs/ui/components/payment-method-selector/` | P2 | Radio-card list (COD / chuyển khoản). Props: options, value, onChange. |
| J7 | OrderSummaryCard | `libs/ui/components/order-summary-card/` | P1 | Breakdown: tạm tính/giảm giá/ship/tổng + nút CTA. |
| K1 | Tabs | `libs/ui/components/tabs/` | P1 | Underline tabs, active = viền dưới primary. Props: tabs[], activeKey, onChange. |
| K2 | CategoryPillFilter | `libs/ui/components/category-pill-filter/` | P2 | Pill filter chọn 1, active tô đặc primary. Size: sm(32)/md(34). |
| K3 | Breadcrumb | `libs/ui/components/breadcrumb/` | P2 | Trail phân cách chevron, mục cuối tô đậm. Props: items[]. |
| L1 | CouponChip | `libs/ui/components/coupon-chip/` | P3 | Code + desc + copy button. Border dashed primary. |
| L2 | CouponInputBar | `libs/ui/components/coupon-input-bar/` | P2 | Input mã + nút "Áp dụng" + applied state (success bg + remove icon). |
| L3 | CategoryCard | `libs/ui/components/category-card/` | P3 | Image + name + count sản phẩm. |
| L4 | AnnouncementBar | `libs/ui/components/announcement-bar/` | P3 | Text banner + highlighted code. |
| L5 | RemovableFilterChip | `libs/ui/components/removable-filter-chip/` | P2 | Chip từ khoá đang lọc + nút ×. Props: label, onRemove. |
| L6 | SearchPill | `libs/ui/components/search-pill/` | P1 | Ô tìm kiếm bo tròn full. Tone: default / subtle. Props: value, placeholder, tone, onChange, onClear. |
| L7 | InfoBanner | `libs/ui/components/info-banner/` | P3 | Banner cố định (icon + message). Tone: info/success/error/pending. Không tự ẩn. |
| L8 | ProgressBar | `libs/ui/components/progress-bar/` | P1 | Primitive: value (0–100) + color + height. Dùng chung ở flash sale, coupon usage, status breakdown, uploader. |
| M1 | Pagination | `libs/ui/components/pagination/` | P1 | Caption "Hiển thị X–Y trong Z" + page buttons. |
| M2 | Toast | `libs/ui/components/toast/` | P1 | 4 variants: success, error, pending, info. Wrap sonner. |
| M3 | AvatarUpload | `libs/ui/components/avatar-upload/` | P3 | Avatar tròn lớn + nút "Đổi ảnh đại diện" + gợi ý file. |
| M4 | AddressCard | `libs/ui/components/address-card/` | P2 | Tên/SĐT/địa chỉ + badge "Mặc định". Props: fullName, phone, addressLine, isDefault. |
| N1 | Carousel | `libs/ui/components/carousel/` | P1 | Native CSS scroll-snap. Props: slidesPerView, gap, autoplay, loop, showDots, showArrows, children. |

---

## Epic 3: Modules — `libs/ui/modules/` (Orchestrate / wrap external lib)

| # | Task | Path | Priority | Notes |
|---|------|------|----------|-------|
| O1 | AdminSidebar | `libs/ui/modules/sidebar/` | P1 | Brand + nav items + section title. Active state. Collapse support (optional). |
| P1 | StorefrontHeader | `libs/ui/modules/storefront-header/` | P1 | Logo + Nav + Search (input) + Cart badge + UserChip. |
| P2 | AdminTopbar | `libs/ui/modules/admin-topbar/` | P1 | Breadcrumb + DateRange (optional) + Bell + UserChip. |
| P3 | MobileHeader | `libs/ui/modules/mobile-header/` | P1 | lead: logo / back. title. showCart + cartCount. |
| P4 | MobileTabBar | `libs/ui/modules/mobile-tab-bar/` | P1 | Bottom nav 4 tab (62px). Active tab tô primary. |
| P5 | MobileAdminHeader | `libs/ui/modules/mobile-admin-header/` | P2 | Hamburger + title + trailing (avatar / action). |
| Q1 | Table | `libs/ui/modules/table/` | P1 | Wrap @tanstack/react-table. States: default/hover/selected/skeleton. Responsive: table → card list trên mobile. |
| R1 | Modal | `libs/ui/modules/modal/` | P1 | Wrap framer-motion overlay. Title + desc + body + actions. |
| R2 | BottomSheet | `libs/ui/modules/bottom-sheet/` | P2 | Vuốt-đóng. Panel trượt lên từ đáy, drag handle. Mobile thay thế Drawer. |
| S1 | Drawer | `libs/ui/modules/drawer/` | P1 | Slide-in panel (framer-motion). Header + body + actions. |
| S2a | GridLayout | `libs/ui/modules/grid-layout/` | P1 | Generic responsive grid wrapper. Props: columns, gap, responsive, children. |
| S2b | FlashSaleSection | `libs/ui/modules/flash-sale-section/` | P2 | Gradient container + CountdownTimer + CouponChip + grid FlashSaleProductCards. |
| S3 | ImageGallery | `libs/ui/modules/image-gallery/` | P2 | Thumbnails strip + main image. Layout: thumbnail-bottom (desktop) / mobile-dots. |
| S4 | ImageUploader | `libs/ui/modules/image-uploader/` | P2 | Drag-drop zone + progress + preview. Mode: single / grid. |
| S5a | CartLineItem | `libs/ui/modules/cart-line-item/` | P2 | Thumbnail + name/unitPrice + QuantitySelector + lineTotal + delete btn. |
| S5b | AddressForm | `libs/ui/modules/address-form/` | P2 | Fields: họ tên/SĐT/địa chỉ + Select tỉnh-thành + toggle "dùng địa chỉ mặc định" + validate. |
| S6 | RevenueChart | `libs/ui/modules/revenue-chart/` | P3 | Wrap recharts/visx — bar chart 14/30 ngày. Toggle chu kỳ, cột cao nhất tô primary. |
| S7 | DateRangePicker | `libs/ui/modules/date-range-picker/` | P2 | Wrap react-day-picker. Icon lịch + khoảng ngày + popover calendar. |
| S8 | OrderListCard | `libs/ui/modules/order-list-card/` | P2 | Tag (trạng thái) + OrderTimeline (horizontal) + thumbnail + total + nút huỷ/chi tiết. |
| S9 | OrderDetailDrawer | `libs/ui/modules/order-detail-drawer/` | P2 | Drawer + header + AddressCard + OrderTimeline + line items + OrderSummaryCard + Select trạng thái + nút cập nhật. |
| T1 | Footer (Storefront) | `libs/ui/modules/footer/` | P2 | Brand + link columns (Mua sắm/Tài khoản/Hỗ trợ) + footer bottom. |
| J8 | WriteReviewForm | `libs/ui/modules/write-review-form/` | P3 | RatingStars (input mode) + textarea + nút gửi + validate. |
| W1 | Select / Dropdown | `libs/ui/modules/select/` | P1 | Filter dropdown dùng lặp toolbar admin. Props: label, options[], value, onChange, placement. |

---

## Epic 4: Pages (Compose từ components & modules)

| # | Task | Route | Priority | Status | Notes |
|---|------|-------|----------|--------|-------|
| B0 | Home Page (Storefront) | `/` | P1 | TODO | Header + Banner + CategoryPillFilter + Flash Sale + ProductGrid + Footer |
| B1 | Shop / Product List | `/shop` | P1 | TODO | Header + CategoryPillFilter + RemovableFilterChip + SearchPill + GridLayout(ProductCard) + Pagination + Footer |
| B2 | Product Detail (PDP) | `/shop/:id` | P1 | NEW | Breadcrumb + ImageGallery + info + Tabs(Mô tả/Đánh giá) + ReviewCard + RatingBreakdown + WriteReviewForm |
| B3 | Cart / Checkout | `/cart` | P1 | TODO | CartLineItem + CouponInputBar + AddressForm + PaymentMethodSelector + OrderSummaryCard |
| B4 | My Orders | `/orders` | P2 | NEW | Tabs (status filter) + OrderListCard list |
| B5 | Account / Profile | `/account` | P2 | NEW | AvatarUpload + form thông tin + AddressCard |
| B6 | Admin Dashboard | `/admin/dashboard` | P1 | TODO | StatCard × 3 + RevenueChart + StatusBreakdownList + Table (sắp hết hàng) |
| B7 | Admin Products | `/admin/products` | P1 | TODO | SearchPill + Select filter + Table + Pagination + Drawer (thêm/sửa) |
| B8 | Admin Product Edit | `/admin/products/:id/edit` | P2 | TODO | Form (Input, Select, ImageUploader, textarea) + Drawer |
| B9 | Admin Orders | `/admin/orders` | P1 | TODO | SearchPill + DateRangePicker + Select + Table + OrderDetailDrawer |
| B10 | Admin Categories | `/admin/categories` | P2 | NEW | SearchPill + Table + Modal (thêm/sửa category) |
| B11 | Admin Coupons | `/admin/coupons` | P2 | NEW | SearchPill + Table + Drawer (thêm/sửa coupon) + ProgressBar (usage) |
| B12 | Admin Refunds | `/admin/refunds` | P3 | NEW | InfoBanner + DateRangePicker + Table (readonly) |
| M1 | Mobile Home | Mobile `/` | P2 | TODO | MobileHeader + CategoryPillFilter + Flash Sale + ProductGrid + MobileTabBar |
| M2 | Mobile Shop | Mobile `/shop` | P2 | TODO | MobileHeader + SearchPill + Select filter + ProductGrid + MobileTabBar |
| M3 | Mobile PDP | Mobile `/shop/:id` | P2 | NEW | MobileHeader(back) + ImageGallery(dots) + info + MobileStickyActionBar(pdp) |
| M4 | Mobile Cart | Mobile `/cart` | P2 | TODO | MobileHeader(back) + CartLineItem + CouponInputBar + AddressForm + MobileStickyActionBar(cart) |
| M5 | Mobile Orders | Mobile `/orders` | P2 | NEW | MobileHeader + Tabs + OrderListCard + MobileTabBar |
| M6 | Mobile Account | Mobile `/account` | P3 | NEW | MobileHeader(back) + AvatarUpload + form + AddressCard |
| M7 | Mobile Admin Dashboard | Mobile `/admin/dashboard` | P2 | TODO | MobileAdminHeader + StatCard + RevenueChart (rút gọn) + Table→card |
| M8 | Mobile Admin Products | Mobile `/admin/products` | P2 | TODO | MobileAdminHeader(action:+) + SearchPill + Table→card + BottomSheet(sửa) |
| M9 | Mobile Admin Orders | Mobile `/admin/orders` | P2 | TODO | MobileAdminHeader + SearchPill + Table→card |

---

## Suggested Sprint Order

### Sprint 1 — Foundation + Core Components (P1)
1. A1 Design Tokens
2. A2 Typography Scale
3. C1 Button + C2 IconButton
4. C3 Input + C4 Checkbox/Radio
5. E1 Tag
6. L8 ProgressBar
7. M1 Pagination
8. M2 Toast
9. K1 Tabs
10. J1 QuantitySelector
11. L6 SearchPill
12. N1 Carousel
13. W1 Select/Dropdown

### Sprint 2 — Core Modules + Key Components
14. O1 AdminSidebar
15. P1 StorefrontHeader + P2 AdminTopbar
16. P3 MobileHeader + P4 MobileTabBar
17. Q1 Table
18. R1 Modal + S1 Drawer
19. S2a GridLayout
20. F1 ProductCard
21. J7 OrderSummaryCard

### Sprint 3 — Feature Components + Modules
22. F2 FlashSaleProductCard + H1 CountdownTimer
23. G1 StatCard + G2 StatusBreakdownList
24. I1 OrderTimeline
25. J2 RatingStars + J3 ReviewCard + J4 RatingBreakdown
26. S3 ImageGallery + S4 ImageUploader
27. S5a CartLineItem + S5b AddressForm
28. S8 OrderListCard + S9 OrderDetailDrawer
29. T1 Footer
30. Các component P2/P3 còn lại

### Sprint 4 — Pages (Storefront)
31. B0 Home + B1 Shop
32. B2 PDP + B3 Cart
33. B4 Orders + B5 Account

### Sprint 5 — Pages (Admin)
34. B6 Dashboard + B7 Products
35. B8 Product Edit + B9 Orders
36. B10 Categories + B11 Coupons + B12 Refunds

### Sprint 6 — Mobile Pages
37. M1–M6 (Storefront mobile)
38. M7–M9 (Admin mobile)

---

## Notes

- **Components** = single-concern, không wrap external lib nặng.
- **Modules** = orchestrate nhiều components / wrap external lib (tanstack, framer-motion, recharts...).
- **Pages** = compose từ `@p4/ui` components & modules — không chứa UI logic riêng.
- Mỗi task nên có:
  - Acceptance criteria (props, states, responsive breakpoint)
  - Storybook story
  - Unit test cơ bản
- Design reference: `docs/design/design-system.html`
