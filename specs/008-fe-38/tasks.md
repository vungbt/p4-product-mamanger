# Tasks — FE-38

- [ ] T001 Xác nhận phụ thuộc của [FE-38](../../documents/p4/frontend/fe-38.md) và rà [plan](plan.md).
- [ ] T002 (FR-001) — Một component/hook dùng chung cho upload một file và nhiều file, nhận `purpose` theo từng màn.
- [ ] T003 (FR-002) — Hiển thị tiến độ và kết quả từng file; file lỗi không ảnh hưởng các file còn lại, retry không tạo file trùng.
- [ ] T004 (FR-003) — Chỉ dùng file sau khi `complete` xác nhận; không gắn file chưa verify vào dữ liệu nghiệp vụ.
- [ ] T005 (FR-004) — File riêng tư tải qua `GET /api/files/{id}/download` có xác thực, không dùng URL public tĩnh.
- [ ] T006 (FR-005) — Chuyển các chỗ đang dùng `useUploadFile` (ký URL qua `/files/sign-upload-url`) sang ticket rồi ghi rõ phần nào còn dùng luồng cũ.
- [ ] T007 Chạy [nghiệm thu](checklists/acceptance.md) và ghi bằng chứng vào task nguồn.

## Việc tích hợp theo contract

- [ ] T008 Nối query/SDK cho `GET /api/files/uploads/{id}`. Kiểm tra trạng thái tải, lỗi, dữ liệu rỗng và URL khi có query list.
- [ ] T009 Nối form hoặc action cho `POST /api/files/uploads`, `POST /api/files/uploads/{id}/complete`, `POST /api/files/uploads/batch`, `POST /api/files/uploads/batch/complete`, `DELETE /api/files/{id}`. Áp dụng quyền, pending và đồng bộ snapshot theo plan.
- [ ] T010 Tái sử dụng các operation ghi là **Dùng từ** trong plan. Kiểm tra wiring và dữ liệu trên màn này.
