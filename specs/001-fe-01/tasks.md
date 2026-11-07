# Tasks — FE-01

- [x] T001 Xác nhận phụ thuộc của [FE-01](../../documents/frontend/fe-01.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Dùng `@p4/api-sdk/auth`/AuthProvider hiện có: cookie HttpOnly, restore getSession, Google/email cùng luồng; không tạo JWT/refresh rotation hoặc lưu token vào localStorage. Logout/revoke dọn cache và socket.
- [x] T003 (FR-002) — Route/menu/action dựa capability trả từ API; xử lý 401/403 và quyền đổi giữa phiên.
- [x] T004 (FR-003) — Admin không có quyền vào route quản trị thấy trang 403, không bị đá về login.
- [ ] T005 (FR-004) — Google login và email login đi chung một luồng lưu phiên.
- [ ] T006 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

T003 và T004 đã triển khai. Xem checklist để theo dõi riêng các ca kiểm thử còn lại.

## Việc tích hợp theo contract

- [ ] T007 Nghiệm thu phần còn lại của session restore và capability theo checklist. Kiểm tra staff giới hạn, thay đổi quyền và thu hồi phiên đang hoạt động.
- [ ] T008 Chạy Google OAuth sandbox và đối chiếu với luồng email đã kiểm tra. Xác nhận khôi phục cùng profile và dọn cache khi đăng xuất.
