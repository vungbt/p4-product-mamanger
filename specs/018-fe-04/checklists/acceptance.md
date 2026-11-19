# Nghiệm thu — FE-04 · Form sản phẩm và gallery nhiều ảnh

[Task nguồn](../../../documents/p4/frontend/fe-04.md) · [Spec](../spec.md)

- [ ] AC-001 (FR-001) — Tạo/sửa tên, slug, mô tả, category, SEO, size guide; publish chỉ sau khi API cho phép.
- [ ] AC-002 (FR-002) — Upload nhiều ảnh qua ticket/batch process; hiển thị từng ảnh thành công/lỗi; không gắn file chưa verify.
- [ ] AC-003 (FR-003) — Dùng upload chung ở FE-38, không tự viết luồng upload riêng.
- [ ] AC-004 (FR-004) — Lỗi validate hiển thị đúng field; rời form khi còn thay đổi chưa lưu có cảnh báo.
- [ ] AC-005 (FR-005) — Xoá sản phẩm có xác nhận và hiển thị lỗi khi API từ chối.

## Ca kiểm thử theo contract

- [ ] API-01 `POST /api/products` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-02 `PUT /api/products/{id}` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp. Gửi version cũ, xử lý 409 và tải snapshot mới.
- [ ] API-03 `DELETE /api/products/{id}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.
- [ ] API-04 `POST /api/products/{id}/images` · Thao tác hợp lệ phản ánh kết quả server; lỗi giữ dữ liệu nhập và hiện thông báo phù hợp.
- [ ] API-05 `DELETE /api/products/{id}/images/{imageId}` · Thao tác thành công cập nhật lại snapshot liên quan; lỗi giữ bản ghi/trạng thái hiện tại.

## Kịch bản kiểm tra luồng

- [ ] E2E-01 Tạo draft với bảng size và nhiều ảnh. Upload một ảnh lỗi và giữ các ảnh đã complete; mở lại chi tiết để xác nhận gallery theo thứ tự đã lưu.

## Bằng chứng

| AC | Môi trường và dữ liệu | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
| AC-001 | Form dùng SDK thật, Valibot, rich-text Editor từ kit | Đã triển khai; chưa nghiệm thu API thật | `form/components/product-editor.tsx`, `form/components/reference-select.tsx`, `form/hooks/use-product-form.ts`: trường sản phẩm, category/size guide có tìm kiếm/phân trang; create draft, không gọi publish |
| AC-002 | Node 24, upload orchestration với transport/API giả lập | 6 kiểm thử upload qua; chưa upload Cloudinary thật | `libraries/upload/upload-ticket.test.mjs`: verify trước khi trả file, một file lỗi độc lập, retry giữ ticket, phản hồi provider bị mất, file không hợp lệ, hủy khi lấy ticket |
| AC-003 | Mã nguồn form/gallery | Đã dùng chung; chưa nghiệm thu API thật | `libraries/upload/use-ticket-upload.ts` nhận purpose; form gọi với `product`; gallery không có luồng upload riêng |
| AC-004 | Node 24, navigation guard với EventTarget/history giả lập; rà mã xử lý SDK errors | 3 kiểm thử điều hướng qua; lỗi field/409 cần nghiệm thu UI thật | `form/hooks/navigation-guard.test.mjs`, `form/hooks/use-product-form.ts`, `form/components/field-error.ts`: lỗi đúng field, giữ dữ liệu, reload có xác nhận, chặn push/replace/Back/unload |
| AC-005 | SDK delete hook và Dialog của kit | Đã triển khai; chưa nghiệm thu API thật | `form/components/product-editor.tsx`, `form/hooks/use-product-form.ts`: xác nhận, pending, thông báo lỗi server và chỉ điều hướng sau thành công |
| API-01 | `POST /api/products` qua `useCreateProduct` | Đã nối; chưa gọi API local | Gửi stock bắt buộc, HTML, các ID và `imageStorageIds` đã verify; thành công về danh sách; lỗi giữ form. Create không có snapshot cũ để gửi version; lỗi 409 vẫn có thông báo |
| API-02 | `PUT /api/products/{id}` qua `useUpdateProduct` | Đã nối; chưa gọi API local | Gửi `expectedVersion` từ snapshot; không gửi stock; 409 giữ dữ liệu và cho tải lại. Save cập nhật version/form từ response server |
| API-03 | `DELETE /api/products/{id}` qua `useDeleteProduct` | Đã nối; chưa gọi API local | Xác nhận trước khi xóa, hiển thị thông báo từ chối, SDK invalidation đồng bộ danh sách sau thành công |
| API-04 | `POST /api/products/{id}/images` qua `useAddProductImage` | Đã nối; chưa gọi API local | Chỉ thêm file đã complete; thêm theo thứ tự chọn; lưu tiến độ từng operation và đối chiếu fileId server khi thử lưu lại |
| API-05 | `DELETE /api/products/{id}/images/{imageId}` qua `useRemoveProductImage` | Đã nối; chưa gọi API local | Gỡ ảnh khi Save; lỗi giữ thao tác chờ để thử lại, không báo thành công. Gỡ ảnh đầu để API chọn ảnh còn lại đầu tiên làm cover |
| E2E-01 | Chưa có API/browser được phép chạy trong sandbox | Chưa chạy | Luồng có size guide và nhiều ảnh đã nối; kiểm thử độc lập chứng minh file lỗi không chặn file thành công. Chưa thể xác nhận gallery sau khi mở lại bằng API thật |

### Lệnh kiểm chứng

- `pnpm --filter @p4/web build` — qua (TypeScript, SDK generated check và Vite).
- `pnpm lint` — qua; chỉ có 13 thông tin lint có sẵn ngoài mã mới.
- `node --test apps/web/src/libraries/upload/upload-ticket.test.mjs apps/web/src/modules/admin/products/form/hooks/navigation-guard.test.mjs` — 9/9 qua. Đây là kiểm thử độc lập, không thay thế nghiệm thu API thật.
- `git diff --check` — qua.

### Trở ngại và giới hạn

- `curl http://127.0.0.1:3001/health`: không kết nối được; `lsof` không thấy tiến trình nghe ở port 3001. Worktree không có `.env` hoặc `apps/api/.env`.
- Đã kiểm tra `docker ps -a` và `docker compose ls -a`: sandbox từ chối truy cập Docker socket. Không tạo container/DB/Redis hoặc chuyển port.
- Vite tại `127.0.0.1:5173` bị `listen EPERM`; Chromium headless đóng ngay khi launch trong sandbox. Không có nghiệm thu browser thật.
- Storybook không truy cập được qua web tool; đã dùng declarations và composition hiện có của kit.
- Request SDK không nhận `null` cho categoryId/sizeGuideId: cho đổi nhưng không cho xóa tham chiếu đã lưu. Phần publish và list/detail thuộc FE-03. Không sửa các file products ngoài `form/`.
- Các checkbox nghiệm thu phía trên giữ nguyên chưa đánh dấu vì yêu cầu API thật chưa được kiểm chứng.
