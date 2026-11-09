# Spec — FE-01 · Nền tảng phiên đăng nhập và quyền

Nguồn [FE-01](../../documents/p4/frontend/fe-01.md) · Portal **Chung** · Trạng thái nguồn **Đã có một phần**

## Mục tiêu

Hoàn thiện nền tảng phiên đăng nhập và quyền theo contract API hiện hành. Task chỉ hoàn thành khi màn/luồng đã tích hợp API thật và có kết quả nghiệm thu, không chỉ khi API/SDK đã tồn tại.

## Phụ thuộc

Không có

## Yêu cầu

- **FR-001** — Dùng `@p4/api-sdk/auth`/AuthProvider hiện có: cookie HttpOnly, restore getSession, Google/email cùng luồng; không tạo JWT/refresh rotation hoặc lưu token vào localStorage. Logout/revoke dọn cache và socket.
- **FR-002** — Route/menu/action dựa capability trả từ API; xử lý 401/403 và quyền đổi giữa phiên.
- **FR-003** — Admin không có quyền vào route quản trị thấy trang 403, không bị đá về login.
- **FR-004** — Google login và email login đi chung một luồng lưu phiên.

[Nghiệm thu](checklists/acceptance.md)

## Phạm vi bàn giao

Task sở hữu 6 operation dùng trong FE. Xem [quyền, input và kết quả theo operation](plan.md#contract-để-bàn-giao-fe), [thứ tự triển khai](tasks.md) và [ca nghiệm thu](checklists/acceptance.md).
