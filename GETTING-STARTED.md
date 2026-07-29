# Bắt đầu — P4 Product Manager

## 1. Clone & chạy

```bash
git clone git@gitlab.com:training2312930/p4-product-manager.git
cd p4-product-manager
npm install
npm run dev
```

## 2. Fake API

Hỏi mentor URL mockapi.io / json-server. Cần endpoints gợi ý:

- `GET/POST/PUT/DELETE /products`
- `GET/POST /orders`
- (Optional) users — hoặc auth fake phía client

## 3. Tài khoản demo (fake auth)

| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | admin |
| user@demo.com | user123 | user |

*(Định nghĩa trong `src/constants/` — trainee implement check trong `useAuth`)*

## 4. Hai portal

- Mở `/shop` — cần login **user**
- Mở `/admin/dashboard` — cần login **admin**
- User vào `/admin` → bị chặn

## 5. Thứ tự code

Đọc **Thứ tự làm** trong [README.md](./README.md).

## 6. Hỏi agent

`@README.md` + nói rõ portal (admin / storefront) và bước đang làm.
