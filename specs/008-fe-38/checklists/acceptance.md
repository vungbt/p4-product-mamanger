# Nghiệm thu — FE-38 · Upload dùng chung qua ticket

[Task nguồn](../../../documents/frontend/fe-38.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Một component/hook dùng chung cho upload một file và nhiều file, nhận `purpose` theo từng màn.
- [ ] AC-002 (FR-002) — Hiển thị tiến độ và kết quả từng file; file lỗi không ảnh hưởng các file còn lại, retry không tạo file trùng.
- [ ] AC-003 (FR-003) — Chỉ dùng file sau khi `complete` xác nhận; không gắn file chưa verify vào dữ liệu nghiệp vụ.
- [ ] AC-004 (FR-004) — File riêng tư tải qua `GET /api/files/{id}/download` có xác thực, không dùng URL public tĩnh.
- [ ] AC-005 (FR-005) — Chuyển các chỗ đang dùng `useUploadFile` (ký URL qua `/files/sign-upload-url`) sang ticket rồi ghi rõ phần nào còn dùng luồng cũ.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/files/uploads` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-02 `POST /api/files/uploads/{id}/complete` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-03 `GET /api/files/uploads/{id}` · Hiển thị dữ liệu từ response 200 và trạng thái tải/lỗi. ID/slug không tồn tại hiện trạng thái 404.
- [ ] API-04 `POST /api/files/uploads/batch` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-05 `POST /api/files/uploads/batch/complete` · Submit nhận 202 và mở trạng thái tác vụ; chỉ hiển thị kết quả khi job đạt trạng thái tương ứng. Mô phỏng mất response rồi retry cùng payload/key, kiểm tra chỉ phát sinh một lần.
- [ ] API-06 `DELETE /api/files/{id}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Upload batch có một file hợp lệ và một file sai loại hoặc quá cỡ. Chỉ attach file đã complete; retry phần lỗi và kiểm tra file đã thành công không bị nhân đôi.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
