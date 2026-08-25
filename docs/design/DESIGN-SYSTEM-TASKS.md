# P4 Product Manager — Design System & Task Breakdown

> Tài liệu tổng hợp toàn bộ components, modules và pages theo design system — chia thành các task nhỏ cho học viên.

---

## A. DESIGN TOKENS (Foundation)

Tokens là nền tảng visual — học viên cần hiểu trước khi code bất kỳ component nào.

| Token | Light Mode | Dark Mode | CSS Variable |
|-------|-----------|-----------|--------------|
| **Primary** | `#ea580c` (Orange 600) | `#f97316` (Orange 500) | `--color-primary` |
| Primary BG | `#fff7ed` | `#7c2d12` | `--color-primary-bg` |
| Primary Hover | `#f97316` | `#fb923c` | `--color-primary-hover` |
| Primary Clicked | `#c2410c` | `#ea580c` | `--color-primary-clicked` |
| **Neutral Text** | `#1e293b` (Slate 800) | `#f1f5f9` | `--color-neutral-text-primary` |
| Neutral Secondary | `#64748b` (Slate 500) | `#94a3b8` | `--color-neutral-text-secondary` |
| Neutral BG | `#f1f5f9` | `#0f172a` | `--color-neutral-bg` |
| Neutral Border | `#e2e8f0` | `#334155` | `--color-neutral-border` |
| **Error** | `#dc2626` | `#f87171` | `--color-error` |
| **Success** | `#16a34a` | `#4ade80` | `--color-success` |
| **Info** | `#0284c7` | `#38bdf8` | `--color-info` |
| **Pending/Warning** | `#ca8a04` | `#fbbf24` | `--color-pending` |

**Font:** Plus Jakarta Sans (primary), monospace fallback  
**Focus ring:** `--color-primary-focus-ring` (`#fed7aa` light / `#c2410c` dark)

---

## B. BASE COMPONENTS (`libs/ui/components/`)

Các component đơn lẻ, không phụ thuộc business logic.

### B1. Button & Actions

| Component | Variants | Props chính | Dùng ở |
|-----------|----------|-------------|--------|
| `Button` | size: `small` / `medium` / `large` · color: `primary` / `neutral` / `error` | `loading`, `icon`, `iconRight`, `type` | Toàn bộ form submit, CTA |
| `IconButton` | shape: `square` / `circle` · variant: `default` / `ghost` / `outline` | `icon`, `badge`, `badgeColor`, `color` | Header actions, sidebar footer |

### B2. Form Controls

| Component | Mô tả | Props chính |
|-----------|--------|-------------|
| `Input` | Text input | `icon`, `placeholder`, `color`, `variant`, `size` |
| `InputPassword` | Input có toggle show/hide | `icon`, `placeholder`, `autoComplete` |
| `Checkbox` | Single checkbox | `checked`, `onChange`, `label`, `color`, `size` |
| `Radio` | Radio button | `checked`, `onChange`, `label` |
| `Textarea` | Multi-line input | `rows`, `placeholder` |
| `FormLabel` | Label cho field | `required`, `children` |
| `FormErrorMessage` | Error text dưới field | `message` |

### B3. Data Display

| Component | Mô tả | Dùng ở |
|-----------|--------|--------|
| `Avatar` | Hình đại diện user | Header, sidebar, user chip |
| `Tag` | Badge/label nhỏ | Order status, product stock |
| `Empty` | Placeholder khi không có data | Bảng trống, list trống |
| `Divider` | Đường kẻ ngang | Form sections, login OR separator |
| `UserChip` | Avatar + name + dropdown | Admin header, admin sidebar footer |

### B4. Navigation

| Component | Mô tả | Dùng ở |
|-----------|--------|--------|
| `Breadcrumb` | Breadcrumb trail | Admin header |
| `Tabs` | Tab navigation | Product detail (nếu mở rộng) |
| `Pagination` | Phân trang | Product list, order list |
| `Menu` | Context menu / dropdown | User actions |

### B5. Feedback & Overlay

| Component | Mô tả | API |
|-----------|--------|-----|
| `Toast` (sonner) | Notification toast | `toastSuccess()`, `toastError()`, `toastInfo()` |
| `ThemeToggle` | Toggle dark/light mode | Tự quản lý state |

### B6. Icons

| Component | Mô tả |
|-----------|--------|
| `RenderIcon` | Render icon theo `name` (lucide-react mapping) |
| `IconName` type | Union type toàn bộ icon names có sẵn |

---

## C. COMPOSITE MODULES (`libs/ui/modules/`)

Modules phức tạp hơn — kết hợp nhiều component, wrap external libs.

### C1. Layout Modules

| Module | Mô tả | Props chính |
|--------|--------|-------------|
| `Header` | Storefront top bar | `logo`, `navItems`, `search`, `actions` |
| `AdminHeader` | Admin top bar + breadcrumbs | `breadcrumbs`, `leading`, `actions` |
| `Sidebar` | Admin side navigation | `collapsed`, `logo`, `sections`, `footer` |
| `Footer` | Storefront footer | `logo`, `tagline`, `contacts`, `linkGroups`, `socialLinks`, `copyright` |

### C2. Form Modules

| Module | Mô tả | Wrap |
|--------|--------|------|
| `Form` | Form container | `@tanstack/react-form` |
| `FormField` | Field wrapper (label + error + child) | — |
| `FormSubmit` | Submit button wrapper (render prop `isSubmitting`) | — |
| `useAppForm` | Hook tạo form instance | `@tanstack/react-form` |
| `z` (Zod) | Schema validation | `zod` |
| `Select` | Dropdown select | `react-select` |
| `SearchInput` | Input với icon search + onSearch | — |
| `RadioGroup` | Group radio buttons | — |
| `RadioButtonGroup` | Button-style radio | — |

### C3. Data Modules

| Module | Mô tả | Wrap |
|--------|--------|------|
| `Table` | Data table | `@tanstack/react-table` |
| `Modal` | Dialog overlay | `framer-motion` |
| `Drawer` | Slide-in panel | `framer-motion` |
| `Datepicker` | Date picker | `react-date-picker` |
| `DateRangePicker` | Date range | `react-date-picker` |
| `Timepicker` | Time picker | `react-time-picker` |

---

## D. APP-LEVEL LIBRARIES (`apps/web/src/libraries/`)

Components dùng chung trên nhiều page nhưng thuộc web app (không phải UI lib).

| Library | Mô tả | Dùng ở |
|---------|--------|--------|
| `BrandLogo` | Logo P4 (variants: `header`, `mark`, `header-white`, `mark-white`) | Login, header, footer, sidebar |
| `LanguageSwitcher` | Toggle vi/en | Header, login pages |
| `UserAccountMenu` | Dropdown menu cho logged-in user | Storefront header |
| `GoogleLoginButton` | Nút đăng nhập Google (GIS) | Storefront login, register |

---

## E. PAGE MODULES — Phân chia task cho học viên

### E1. STOREFRONT PORTAL

#### Task SF-01: Home Page (`/`)
**File:** `modules/storefront/home/page.tsx`  
**Mô tả:** Landing page — hero banner, featured products, categories  
**Components cần dùng:**
- `Button` (CTA "Shop Now")
- Product card (tự tạo — xem Task SF-02)
- Có thể dùng grid layout Tailwind

**API:** `GET /api/products?page=1&pageSize=8` (featured)  
**Độ khó:** ⭐⭐

---

#### Task SF-02: Shop Page (`/shop`)
**File:** `modules/storefront/shop/page.tsx`  
**Mô tả:** Danh sách sản phẩm có search + pagination  
**Components cần tạo nội bộ:**
- `product-card.tsx` — Card hiển thị ảnh, tên, giá, nút "Add to Cart"

**Components từ `@p4/ui`:**
- `SearchInput` (tìm sản phẩm)
- `Pagination` (phân trang)
- `Empty` (khi không có kết quả)
- `Button` (Add to Cart)
- `Tag` (stock status)

**API:** `GET /api/products?page={page}&pageSize={pageSize}&q={query}`  
**Hook:** `useProducts` (đặt `src/hooks/use-products.ts` vì dùng chung admin + storefront)  
**Độ khó:** ⭐⭐⭐

---

#### Task SF-03: Cart Page (`/cart`)
**File:** `modules/storefront/cart/page.tsx`  
**Hook nội bộ:** `use-cart.ts`  
**Mô tả:** Giỏ hàng + checkout  
**Components cần tạo nội bộ:**
- `cart-item.tsx` — Row hiển thị product, quantity +-buttons, remove
- `cart-summary.tsx` — Tóm tắt: subtotal, shipping, coupon, total

**Components từ `@p4/ui`:**
- `Button` (Checkout, Remove, +/-)
- `IconButton` (Delete item)
- `Input` (Coupon code input)
- `Empty` (Giỏ hàng trống)
- `Divider` (Ngăn cách sections)

**API:**
- `POST /api/orders` (Checkout)
- `POST /api/coupons/preview` (Xem trước discount)

**State:** localStorage hoặc React state (items, quantities)  
**Độ khó:** ⭐⭐⭐⭐

---

#### Task SF-04: Storefront Login (`/login`) ✅ ĐÃ IMPLEMENT
**File:** `modules/storefront/login/page.tsx`  
**Components đã dùng:** `Form`, `FormField`, `FormSubmit`, `Input`, `InputPassword`, `Button`, `Divider`, `BrandLogo`, `LanguageSwitcher`, `GoogleLoginButton`  
**Pattern reference:** Hero image slider + form panel side-by-side

---

#### Task SF-05: Register (`/register`) ✅ ĐÃ IMPLEMENT
**File:** `modules/storefront/register/page.tsx`  
**Components đã dùng:** `Form`, `FormField`, `FormSubmit`, `Input`, `InputPassword`, `Button`, `Divider`, `BrandLogo`, `LanguageSwitcher`, `GoogleLoginButton`

---

#### Task SF-06: Change/Set Password (`/account/password`) ✅ ĐÃ IMPLEMENT
**File:** `modules/storefront/password/page.tsx`  
**Components đã dùng:** `Form`, `FormField`, `FormSubmit`, `InputPassword`, `Button`, `BrandLogo`

---

### E2. ADMIN PORTAL

#### Task AD-01: Admin Login (`/admin/login`) ✅ ĐÃ IMPLEMENT
**File:** `modules/admin/login/page.tsx`  
**Components đã dùng:** `Form`, `FormField`, `FormSubmit`, `Input`, `InputPassword`, `Button`, `Checkbox`, `RenderIcon`, `BrandLogo`, `LanguageSwitcher`

---

#### Task AD-02: Admin Layout ✅ ĐÃ IMPLEMENT
**Files:** `modules/admin/layout/`  
**Components đã dùng:** `Sidebar`, `AdminHeader`, `IconButton`, `ThemeToggle`, `UserChip`, `Breadcrumb`, `Divider`, `CollapsibleShellProvider`

---

#### Task AD-03: Dashboard (`/admin/dashboard`)
**File:** `modules/admin/dashboard/page.tsx`  
**Mô tả:** Tổng quan business — revenue, order count, low-stock  
**Components cần tạo nội bộ:**
- `stat-card.tsx` — Card hiển thị metric (icon + value + label)
- `low-stock-table.tsx` — Bảng products sắp hết hàng

**Components từ `@p4/ui`:**
- `Table` (low-stock products)
- `Tag` (stock warning badges)
- `RenderIcon` (stat icons)
- `Empty` (nếu chưa có data)

**API:** `GET /api/dashboard/stats`  
**Độ khó:** ⭐⭐

---

#### Task AD-04: Products List (`/admin/products`)
**File:** `modules/admin/products/page.tsx`  
**Mô tả:** CRUD table sản phẩm  
**Components cần tạo nội bộ:**
- `product-table.tsx` — Table columns: image, name, price, stock, actions
- `delete-product-modal.tsx` — Confirm xóa

**Components từ `@p4/ui`:**
- `Table` (danh sách)
- `SearchInput` (tìm kiếm)
- `Pagination` (phân trang)
- `Button` (Add new, Edit)
- `IconButton` (Delete, Edit icons)
- `Modal` (Confirm delete)
- `Tag` (stock status)
- `Empty` (no products)

**API:**
- `GET /api/products?page=&pageSize=&q=`
- `DELETE /api/products/:id`

**Độ khó:** ⭐⭐⭐

---

#### Task AD-05: Product Create/Edit (`/admin/products/new`, `/admin/products/:id/edit`)
**File:** Có thể tạo `modules/admin/products/product-form.tsx` dùng chung  
**Mô tả:** Form tạo/sửa sản phẩm + upload ảnh  
**Components từ `@p4/ui`:**
- `Form`, `FormField`, `FormSubmit`
- `Input` (name, price, stock)
- `Textarea` (description)
- `Select` (category)
- `Button` (Save, Cancel)

**Components cần tạo nội bộ:**
- `image-uploader.tsx` — Upload ảnh qua Cloudinary signed URL

**API:**
- `GET /api/files/sign-upload-url?name=...` (lấy signed URL)
- `POST /api/products` (create)
- `PUT /api/products/:id` (update)
- `GET /api/categories` (dropdown data)

**Flow upload:**
1. Gọi `GET /api/files/sign-upload-url`
2. POST file lên Cloudinary (`uploadUrl`)
3. Gửi `imageStorageId` (publicId) trong body create/update

**Độ khó:** ⭐⭐⭐⭐

---

#### Task AD-06: Orders List (`/admin/orders`)
**File:** `modules/admin/orders/page.tsx`  
**Mô tả:** Danh sách đơn hàng + filter + shipment update  
**Components cần tạo nội bộ:**
- `order-table.tsx` — Columns: ID, user, total, status, date, actions
- `order-detail-drawer.tsx` — Chi tiết đơn hàng slide-in
- `shipment-modal.tsx` — Cập nhật shipment status

**Components từ `@p4/ui`:**
- `Table` (danh sách)
- `SearchInput` (search by email/id)
- `Pagination`
- `Drawer` (order detail)
- `Modal` (shipment update)
- `Tag` (order status colors)
- `Button`, `IconButton`
- `Select` (shipment status dropdown)
- `Input` (tracking code)

**API:**
- `GET /api/orders?page=&pageSize=&q=`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/shipment`

**Độ khó:** ⭐⭐⭐⭐

---

## F. HOOKS & SERVICES

### Hooks dùng chung (`src/hooks/`)

| Hook | Mô tả | API |
|------|--------|-----|
| `use-auth` | Re-export `@p4/auth` — login, logout, user, isAuthenticated | `/api/auth/*` |
| `use-products` | Fetch product list (dùng chung admin + storefront) | `/api/products` |

### Hooks nội bộ feature (đặt cạnh page)

| Hook | Feature | Mô tả |
|------|---------|--------|
| `use-cart` | storefront/cart | Cart state (items, add, remove, updateQty, total, clear) |
| `use-admin-breadcrumbs` | admin/layout | Generate breadcrumb từ current route |

---

## G. THỨ TỰ THỰC HIỆN (Recommended)

```
Phase 1: Foundation
├── Đọc hiểu design tokens, API docs
├── Setup `use-auth` (đã có sẵn)
└── Hiểu routing + protected routes (đã có sẵn)

Phase 2: Admin Portal
├── AD-03: Dashboard (đơn giản nhất)
├── AD-04: Products List (learn Table + Search + Pagination)
├── AD-05: Product Form (learn Form + Upload)
└── AD-06: Orders List (learn Drawer + Modal + complex state)

Phase 3: Storefront
├── SF-02: Shop Page (reuse useProducts, learn product-card)
├── SF-01: Home Page (hero + featured products)
└── SF-03: Cart + Checkout (complex state + API call)
```

---

## H. COMPONENT REUSE MAP

Sơ đồ components xuất hiện ở nhiều page:

```
Button          → Login, Register, Shop, Cart, Dashboard, Products, Orders
Input           → Login, Register, Products Form, Orders Search
Table           → Dashboard (low-stock), Products List, Orders List
Pagination      → Shop, Products List, Orders List
SearchInput     → Shop (header), Products List, Orders List
Tag             → Shop (stock), Products List, Orders List (status)
Modal           → Products Delete, Orders Shipment
Drawer          → Orders Detail
Form/FormField  → Login, Register, Password, Product Form
Empty           → Shop (no results), Cart (empty), Tables (no data)
Toast           → Toàn bộ actions (success/error feedback)
IconButton      → Header, Sidebar, Table actions
UserChip        → Admin Header, Admin Sidebar
ThemeToggle     → Admin Header, Storefront Header
```

---

## I. NAMING & FILE CONVENTIONS

```
modules/{portal}/{feature}/
├── page.tsx                    # Route entry — lazy loaded
├── use-{feature}.ts           # Hook nội bộ (chỉ feature này dùng)
├── {feature}-{component}.tsx  # Component nội bộ
└── {feature}.types.ts         # Types nội bộ (nếu cần)
```

**Ví dụ admin/products:**
```
modules/admin/products/
├── page.tsx                   # Entry — chứa switch create/edit/list
├── product-table.tsx          # Table component
├── product-form.tsx           # Create/Edit form
├── delete-product-modal.tsx   # Confirm delete
└── image-uploader.tsx         # Cloudinary upload
```

**Ví dụ storefront/cart:**
```
modules/storefront/cart/
├── page.tsx                   # Cart page
├── use-cart.ts                # Cart state management
├── cart-item.tsx              # Single cart item row
└── cart-summary.tsx           # Totals + checkout button
```
