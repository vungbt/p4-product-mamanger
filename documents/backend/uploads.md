# Upload ảnh đơn và nhiều ảnh

Cùng backend cho Admin/Storefront. Quyền phụ thuộc `purpose` và owner:
`product` cần `write:Catalog`, `blog` cần `write:Content`; không chỉ dựa vào URL.
Ảnh `support`/`return` là private. Không đưa token API vào request tới storage.

## Upload một ảnh

1. `POST /api/files/uploads`, body `{ purpose: 'product', resourceId?: productId }`.
   Helper `postFilesUploads`, hook `usePostFilesUploads`.
2. API trả `id` (ticket), `uploadUrl`, `publicId`, giới hạn size/MIME và hạn ticket.
   POST `FormData` chứa `file` tới `uploadUrl` bằng fetch. Không tự đặt Content-Type;
   trình duyệt cần tự tạo multipart boundary. `publicId` này chính là storage ID.
3. `POST /api/files/uploads/{id}/complete`, path `id` là ticket ID.
   Helper `postFilesUploadsIdComplete`, hook `usePostFilesUploadsIdComplete`.
   API xác minh file từ provider: đúng owner/ticket/purpose, MIME/format, kích thước,
   số pixel và trạng thái. Lấy `fileId` từ ticket đã completed khi cần file reference.
4. Gắn ảnh vào resource sau khi xác minh thành công. Với product:
   `POST /api/products` nhận `imageStorageId: publicId` và
   `imageStorageIds: publicIds[]`; thêm gallery bằng
   `POST /api/products/{id}/images` với `{ imageStorageId: publicId, sortOrder }`.
   Không dùng URL, ticket ID hoặc fileId thay cho imageStorageId.

Ticket hiện có hạn 10 phút; avatar tối đa 2 MiB, các purpose khác tối đa 10 MiB.
Các giới hạn thực tế phải đọc từ response ticket; ảnh hỗ trợ JPEG/PNG/WebP.

## Upload nhiều ảnh

| Bước | Endpoint | Hook |
| --- | --- | --- |
| Cấp ticket theo danh sách file | `POST /api/files/uploads/batch` | `usePostFilesUploadsBatch` |
| Xác minh các ticket bằng worker | `POST /api/files/uploads/batch/complete` | `usePostFilesUploadsBatchComplete` |
| Theo dõi tổng tiến độ | `GET /api/processes/{id}` | `useGetProcessesId` |
| Xem kết quả/lỗi từng ảnh | `GET /api/processes/{id}/items` | `useGetProcessesIdItems` |
| Đọc lại ticket và fileId | `GET /api/files/uploads/{id}` | `useGetFilesUploadsId` |

1. Tạo batch với `{ purpose: 'product', names: ['front.jpg', 'back.jpg'], resourceId? }`.
   API nhận từ 1 đến 20 tên, trả `201` với `{ data: { batchId, tickets } }`.
   Mỗi ticket có tên, ticket ID, upload URL và publicId riêng. `batchId` chỉ là
   mã batch trả về; không có endpoint `/batch/{batchId}/complete`.
2. Gửi từng file tới upload URL tương ứng. Có thể chạy song song có giới hạn;
   theo dõi kết quả riêng từng file và chỉ đưa ticket upload thành công vào bước sau.
   Đây không phải một HTTP request chứa toàn bộ ảnh gửi vào API.
3. Gọi `/batch/complete` với `{ ticketIds: [...] }` và header `Idempotency-Key`.
   Giữ cùng key khi retry cùng payload; payload khác phải có key khác.
4. API trả `202` cùng process `media.batch`. Cần worker chạy để xử lý.
   Poll process/items hoặc dùng realtime process.updated. Một request 202 chỉ
   xác nhận đã nhận việc, chưa có nghĩa ảnh đã được verify thành công.
5. Xử lý `completed`, `completed_with_errors`, `failed`; đọc từng item/ticket.
   Chỉ gắn các ảnh có ticket completed/fileId hợp lệ. Các ảnh lỗi cần báo riêng
   và upload lại theo ticket mới nếu ticket cũ hết hạn hoặc bị từ chối.
6. Dùng publicId đã lưu theo từng ticket để gửi imageStorageId(s) khi tạo product
   hoặc thêm gallery. Mỗi lần thêm gallery là một operation theo ảnh.
   Không gửi imageStorageIds vào PUT rồi mặc định gallery sẽ được thay thế:
   cập nhật gallery hiện dùng endpoint thêm/xóa ảnh riêng.

SDK có helper/hook cho tất cả endpoint trên. Hook chỉ bọc API tương ứng;
nó không tự upload file tới Cloudinary hay tự nối cả workflow batch.
`useUploadFile` cũ trong `@p4/api-client` upload một file và trả URL; giá trị URL đó
không thay thế storage ID hoặc kết quả verify khi gắn vào product.
