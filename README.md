# P4 — Product Manager (React SPA)

> Tuần 5 · React Router · Call API · Custom Hook · **2 portal: Admin + End User**

Repo GitLab: https://gitlab.com/training2312930/p4-product-manager

**Mới vào?** Đọc [GETTING-STARTED.md](./GETTING-STARTED.md).

---

## Tổng quan

Ứng dụng quản lý & bán sản phẩm — **1 codebase, 2 portal tách route**:

| Portal | Prefix route | Ai dùng | Quyền |
|--------|--------------|---------|-------|
| **Storefront** (End User) | `/`, `/shop`, `/cart`... | Khách hàng | Login, xem SP, mua hàng |
| **Admin** | `/admin/*` | Quản trị | CRUD SP, stock, doanh thu |

**End user không được** vào `/admin` và **không có quyền** thêm/sửa/xóa sản phẩm.

---

## Portal 1 — End User (Storefront)

### Auth
- Login fake (email/password cứng hoặc mock — mentor cung cấp tài khoản mẫu)
- Role: `user`
- Sau login → redirect `/shop`

### Chức năng
1. **Đăng nhập / đăng xuất**
2. **Xem danh sách sản phẩm** — lấy từ Fake API (chỉ đọc)
3. **Chi tiết sản phẩm** (optional — có thể modal hoặc trang riêng)
4. **Giỏ hàng** — thêm/bớt số lượng (state local hoặc localStorage)
5. **Đặt hàng (checkout)** — gọi API tạo order (hoặc mock), trừ stock trên server
6. **Không** truy cập được `/admin/*` — redirect + toast lỗi "Không có quyền"

---

## Portal 2 — Admin

### Auth
- Login riêng hoặc chung form nhưng **check role `admin`**
- Role: `admin`
- Sau login → redirect `/admin/dashboard`

### Chức năng
1. **Dashboard**
   - Tổng doanh thu (tính từ orders)
   - Sản phẩm sắp hết hàng (stock ≤ ngưỡng, VD: 10)
   - (Gợi ý) biểu đồ đơn giản hoặc bảng thống kê
2. **CRUD Sản phẩm**
   - Fields: `name`, `price`, `description`, `imageUrl`, `stock`
   - List + search theo tên
   - Create / Update / Delete qua Fake API
3. **Quản lý stock** — hiển thị & cập nhật qua form sửa sản phẩm
4. **Quản lý doanh thu** — xem danh sách orders + tổng tiền
5. **Không** cho end user (`role: user`) vào admin — `ProtectedRoute` chặn

---

## Yêu cầu kỹ thuật

| Yêu cầu | Chi tiết |
|---------|----------|
| **React Router** | Tách layout Admin vs Storefront; nested routes |
| **Protected Route** | Guard theo `role`: `admin` \| `user` |
| **Fake API** | mockapi.io hoặc json-server — mentor setup endpoint |
| **Custom Hook** | `useAuth`, `useProducts`, `useCart` (gợi ý) |
| **Form** | Formik + Yup (admin form sản phẩm) |
| **Toast** | react-toastify |
| **TypeScript** | Product, Order, User, Role, CartItem... |
| **Styling** | CSS Modules (`.module.scss`) |

Logic **không** nhét hết vào page component — tách hook/service.

---

## Cấu trúc thư mục gợi ý

```
src/
├── types/
├── constants/          # ROUTES, ROLES, API_URL
├── services/           # api client: products, orders, auth
├── hooks/
│   ├── useAuth.ts
│   ├── useProducts.ts
│   └── useCart.ts
├── components/
│   └── ui/             # Button, EmptyState...
├── modules/
│   ├── admin/
│   │   ├── layout/
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   └── orders/
│   │   └── components/
│   └── storefront/
│       ├── layout/
│       ├── pages/
│       │   ├── login/
│       │   ├── shop/
│       │   └── cart/
│       └── components/
├── routes/
│   ├── index.tsx       # BrowserRouter + route config
│   └── ProtectedRoute.tsx
├── styles/
├── App.tsx
└── main.tsx
```

---

## Route map gợi ý

```
/storefront
  /login              → Login end user
  /shop               → Danh sách SP (auth user)
  /cart               → Giỏ hàng

/admin
  /admin/login        → Login admin (hoặc /login?portal=admin)
  /admin/dashboard    → Doanh thu + stock cảnh báo
  /admin/products     → List + CRUD
  /admin/products/new
  /admin/products/:id/edit
  /admin/orders       → Doanh thu / orders
```

---

## Fake Auth gợi ý

```typescript
// constants/mock-users.ts — mentor có thể đổi
// admin@demo.com / admin123 → role: admin
// user@demo.com / user123  → role: user
```

Lưu session: `localStorage` (token fake + role + user info).

`ProtectedRoute` đọc role → cho phép hoặc `<Navigate to="..." />`.

---

## Thứ tự làm (gợi ý)

1. Types + constants (Product, User, Role, routes)
2. `services/` — fetch products từ API
3. `useAuth` + login/logout + lưu session
4. `ProtectedRoute` + route config cơ bản
5. Admin: list + CRUD products
6. Admin: dashboard (revenue, low stock)
7. Storefront: shop list (read-only products)
8. Storefront: cart + checkout
9. Test: user login → không vào `/admin`; admin CRUD OK

---

## Quy tắc

- ❌ Không copy solution / AI làm hộ
- ❌ End user **không** có UI/action CRUD sản phẩm
- ✅ Commit từng feature: `feat(p4): admin product list`, `feat(p4): storefront cart`
- ✅ Push GitLab sau mỗi milestone

---

## Liên hệ P6 (Next.js)

Tuần 7 port **cùng nghiệp vụ** sang Next.js App Router — giữ API & role model tương tự.
