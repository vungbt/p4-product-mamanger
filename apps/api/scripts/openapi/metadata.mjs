/**
 * Nội dung viết tay cho Scalar: mô tả chung, tag, summary từng operation và phần schema
 * mà generate.mjs không suy ra được từ code (mảng lồng được parse thủ công, handler dùng chung).
 *
 * OPERATIONS: 'METHOD /path': [summary, ghi chú nghiệp vụ tuỳ chọn]
 * OVERRIDES:  'METHOD /path': { fields, omit, requestBody, response, responseFields, list, parameters }
 *   - fields: thêm/ghi đè field trong body, { name: { schema, required } }
 *   - omit: bỏ field mà handler dùng chung đọc nhưng không áp dụng cho route này
 *   - { ref: 'Name' } trỏ tới schema trong contract dùng chung
 */

export const API_DESCRIPTION = `API cho shop quần áo: Admin và Storefront.

## Xác thực
Gửi \`Authorization: Bearer <token>\` với \`token\` lấy từ response đăng nhập. Token hết hạn thì gọi \`POST /api/auth/refresh\`.
Mỗi operation ghi rõ quyền cần có; danh sách quyền của user hiện tại lấy từ \`GET /api/me/capabilities\`.

## Quy ước chung
- Response thành công có dạng \`{ data, message? }\`, danh sách có thêm \`meta\` phân trang.
- Số tiền là số nguyên VND, không nhân/chia 100.
- \`X-Request-Id\` có trong mọi response, dùng khi báo lỗi.
- \`expectedVersion\` bảo vệ cập nhật đồng thời; sai version trả 409.
- \`Idempotency-Key\` bắt buộc ở các giao dịch và job được ghi chú. Retry cùng payload dùng lại key cũ;
  cùng key khác payload trả 409.

## Import, export và upload nhiều file
Các thao tác này trả 202 kèm process. Theo dõi trạng thái, version và tiến độ qua \`GET /api/processes/{id}\`
hoặc Socket.IO. Import luôn kiểm tra trước, trả lỗi từng dòng, rồi chờ \`POST /api/processes/{id}/confirm\`
mới ghi dữ liệu. Giới hạn: import 5.000 dòng, export 10.000 dòng; file hết hạn sau 24 giờ.

## Realtime
Socket.IO cùng origin với API. Handshake gửi \`auth: { token, offset }\`. Server phát event tên \`event\` gồm
\`id\`, \`createdAt\` và \`payload\` có \`type\` là \`process.updated\`, \`notification.created\` hoặc
\`notification.read\`. Khi reconnect, gửi \`offset\` cuối để nhận lại event bị lỡ của chính user đó.
FE gộp process theo \`version\` và notification theo \`id\`. Client dùng sẵn trong \`@p4/realtime\`, \`@p4/processes\`.

## Đổi hàng
\`settlementPolicy=refund_and_repurchase\`: hoàn tiền đơn gốc và thanh toán đơn thay thế là hai giao dịch
độc lập; \`priceDifference\` chỉ là chênh lệch ròng để hiển thị.

## Lưu ý vận hành
API và worker phải dùng chung \`PROCESS_STORAGE_DIR\`. Stripe, Cloudinary và mail cần cấu hình provider;
mock chỉ dùng ngoài production. Báo cáo ledger không tự suy diễn các bản ghi cũ thiếu bằng chứng thu/hoàn.`;

export const TAG_DESCRIPTIONS = {
  accounts: 'Đăng ký, xác minh email, đặt lại mật khẩu, hồ sơ, tuỳ chọn và phiên đăng nhập.',
  addresses: 'Sổ địa chỉ giao hàng của người dùng.',
  audit: 'Nhật ký thao tác quản trị.',
  auth: 'Đăng nhập, refresh token, đăng xuất và thông tin người dùng hiện tại.',
  cart: 'Giỏ hàng lưu phía server theo từng SKU.',
  catalog: 'Xuất bản sản phẩm, biến thể SKU và bảng size.',
  categories: 'Danh mục sản phẩm.',
  checkout: 'Báo giá checkout: server tính giá, giảm giá và phí ship rồi lưu snapshot.',
  content: 'Blog, trang CMS, chính sách, revision và lịch xuất bản.',
  coupons: 'Mã giảm giá.',
  dashboard: 'Số liệu tổng quan cho Admin.',
  discovery: 'Tìm kiếm, gợi ý và bộ lọc sản phẩm.',
  exchanges: 'Đổi hàng, gắn với yêu cầu trả hàng và đơn thay thế.',
  files: 'Upload ticket theo owner/purpose, tải file và xoá file.',
  fulfillment: 'Nhiều kiện hàng cho một đơn, trạng thái vận chuyển và tracking.',
  inventory: 'Tồn kho theo SKU qua ledger: nhập kho, điều chỉnh, đối soát.',
  jobs: 'Theo dõi và chạy lại job nền.',
  merchandising: 'Bộ sưu tập, banner, điều hướng và bố cục trang chủ.',
  notifications: 'Hộp thư thông báo, tuỳ chọn nhận và mẫu thông báo.',
  operations: 'Health check, metrics và đối soát vận hành.',
  orders: 'Đặt đơn, vòng đời đơn hàng và yêu cầu huỷ.',
  payments: 'Lần thanh toán, COD, thanh toán mock và webhook Stripe có chữ ký.',
  processes:
    'Import/export và upload nhiều file bằng worker: preview, tiến độ, lỗi từng dòng, tải file riêng tư.',
  products: 'Sản phẩm, ảnh và đánh giá theo sản phẩm.',
  promotions: 'Khuyến mãi tự động và lịch sử dùng coupon.',
  refunds: 'Hoàn tiền, retry, đối soát và xác nhận chuyển khoản thủ công.',
  reports: 'Báo cáo doanh thu, đơn hàng, tồn kho, sản phẩm và file export.',
  returns: 'Trả hàng: duyệt, nhận hàng, kiểm tra và hoàn tất.',
  reviews: 'Đánh giá đã mua, kiểm duyệt, phản hồi và báo cáo vi phạm.',
  settings: 'Cấu hình shop, thương mại và phương thức vận chuyển.',
  staff: 'Nhân viên, vai trò, lời mời và quản lý trạng thái khách hàng.',
  support: 'Ticket hỗ trợ, tin nhắn và ghi chú nội bộ.',
  system: 'Quyền của người dùng hiện tại và contract trạng thái.',
  wishlist: 'Danh sách yêu thích và đăng ký báo còn hàng.',
};

export const OPERATIONS = {
  // accounts
  'POST /api/auth/register': ['Đăng ký tài khoản khách hàng'],
  'POST /api/auth/email-verification-requests': [
    'Gửi lại email xác minh',
    'Luôn trả thành công để không lộ email nào đã đăng ký.',
  ],
  'POST /api/auth/password-reset-requests': [
    'Yêu cầu đặt lại mật khẩu',
    'Luôn trả thành công để không lộ email nào đã đăng ký.',
  ],
  'POST /api/auth/email-verifications': ['Xác minh email bằng token'],
  'POST /api/auth/password-resets': ['Đặt lại mật khẩu bằng token'],
  'GET /api/me/profile': ['Xem hồ sơ của tôi'],
  'PATCH /api/me/profile': ['Cập nhật hồ sơ của tôi'],
  'GET /api/me/preferences': ['Xem tuỳ chọn của tôi'],
  'PATCH /api/me/preferences': ['Cập nhật tuỳ chọn của tôi'],
  'POST /api/me/email-change-requests': ['Yêu cầu đổi email'],
  'POST /api/me/email-changes/confirm': ['Xác nhận đổi email bằng token'],
  'GET /api/me/sessions': ['Danh sách phiên đăng nhập của tôi'],
  'DELETE /api/me/sessions/{id}': ['Thu hồi một phiên đăng nhập'],
  'POST /api/me/sessions/revoke-others': ['Thu hồi mọi phiên khác'],

  // addresses
  'GET /api/addresses': ['Danh sách địa chỉ của tôi'],
  'POST /api/addresses': ['Thêm địa chỉ'],
  'PUT /api/addresses/{id}': ['Cập nhật địa chỉ'],
  'DELETE /api/addresses/{id}': ['Xoá địa chỉ'],
  'PATCH /api/addresses/{id}/default': ['Đặt địa chỉ mặc định'],

  // audit
  'GET /api/admin/audit-logs': ['Danh sách nhật ký thao tác'],
  'GET /api/admin/audit-logs/{id}': ['Chi tiết nhật ký thao tác'],

  // auth
  'POST /api/auth/login': ['Đăng nhập bằng email và mật khẩu'],
  'POST /api/auth/google': ['Đăng nhập bằng Google ID token'],
  'POST /api/auth/refresh': ['Lấy access token mới từ refresh token'],
  'GET /api/auth/me': ['Thông tin người dùng hiện tại'],
  'PATCH /api/auth/me': ['Cập nhật thông tin người dùng hiện tại'],
  'PATCH /api/auth/password': ['Đặt hoặc đổi mật khẩu'],
  'POST /api/auth/logout': ['Đăng xuất và thu hồi refresh token'],

  // cart
  'GET /api/cart': ['Xem giỏ hàng'],
  'POST /api/cart/items': ['Thêm SKU vào giỏ'],
  'DELETE /api/cart/items': ['Xoá toàn bộ giỏ'],
  'PATCH /api/cart/items/{id}': ['Đổi số lượng một dòng trong giỏ'],
  'DELETE /api/cart/items/{id}': ['Xoá một dòng trong giỏ'],
  'POST /api/cart/merge': ['Gộp giỏ khách vãng lai sau khi đăng nhập'],

  // catalog
  'GET /api/admin/products': ['Danh sách sản phẩm (Admin, gồm bản nháp)'],
  'GET /api/admin/products/{id}': ['Chi tiết sản phẩm (Admin)'],
  'GET /api/products/by-slug/{slug}': [
    'Xem sản phẩm theo slug',
    'Slug cũ được chuyển sang sản phẩm hiện tại qua bản ghi redirect.',
  ],
  'PATCH /api/products/{id}/publication': ['Đổi trạng thái xuất bản sản phẩm'],
  'GET /api/products/{id}/variants': ['Danh sách SKU đang bán của sản phẩm'],
  'POST /api/products/{id}/variants': ['Tạo SKU'],
  'GET /api/admin/products/{id}/variants': ['Danh sách SKU của sản phẩm (Admin)'],
  'GET /api/admin/variants': ['Tìm SKU trên toàn catalog'],
  'PATCH /api/products/{id}/variants/{variantId}': [
    'Cập nhật SKU',
    'Không nhận `stock`, `onHand`, `reserved`: tồn kho chỉ đổi qua ledger ở nhóm inventory.',
  ],
  'PATCH /api/products/{id}/variants/{variantId}/images': ['Gán ảnh cho SKU'],
  'GET /api/admin/size-guides': ['Danh sách bảng size'],
  'POST /api/admin/size-guides': ['Tạo bảng size'],
  'GET /api/admin/size-guides/{id}': ['Chi tiết bảng size'],
  'PATCH /api/admin/size-guides/{id}': ['Cập nhật bảng size'],

  // categories
  'GET /api/categories': ['Danh sách danh mục'],
  'POST /api/categories': ['Tạo danh mục'],
  'GET /api/categories/{id}': ['Chi tiết danh mục'],
  'PUT /api/categories/{id}': ['Cập nhật danh mục'],
  'DELETE /api/categories/{id}': ['Xoá danh mục'],

  // checkout
  'POST /api/checkout/quotes': [
    'Tạo báo giá checkout',
    'Không gửi `items` thì dùng giỏ hàng hiện tại. Giá, giảm giá và phí ship đều do server tính.',
  ],
  'GET /api/checkout/quotes/{id}': ['Xem báo giá checkout'],

  // content
  'GET /api/posts': ['Danh sách bài viết đã xuất bản'],
  'GET /api/posts/{slug}': ['Xem bài viết đã xuất bản'],
  'GET /api/admin/posts': ['Danh sách bài viết (Admin)'],
  'POST /api/admin/posts': ['Tạo bài viết nháp'],
  'GET /api/admin/posts/{id}': ['Chi tiết bài viết (Admin)'],
  'PATCH /api/admin/posts/{id}': [
    'Cập nhật bài viết nháp',
    'Bản đang xuất bản giữ nguyên cho đến khi publish lại.',
  ],
  'POST /api/admin/posts/{id}/publish': [
    'Xuất bản hoặc lên lịch bài viết',
    'Có `scheduledAt` thì lên lịch; không có thì xuất bản ngay.',
  ],
  'POST /api/admin/posts/{id}/archive': ['Lưu trữ bài viết'],
  'GET /api/admin/posts/{id}/revisions': ['Lịch sử revision của bài viết'],
  'GET /api/pages/{slug}': ['Xem trang CMS đã xuất bản'],
  'GET /api/admin/pages': ['Danh sách trang CMS (Admin)'],
  'POST /api/admin/pages': ['Tạo trang CMS nháp'],
  'GET /api/admin/pages/{id}': ['Chi tiết trang CMS (Admin)'],
  'PATCH /api/admin/pages/{id}': [
    'Cập nhật trang CMS nháp',
    'Bản đang xuất bản giữ nguyên cho đến khi publish lại.',
  ],
  'POST /api/admin/pages/{id}/publish': [
    'Xuất bản hoặc lên lịch trang CMS',
    'Có `scheduledAt` thì lên lịch; không có thì xuất bản ngay.',
  ],
  'POST /api/admin/pages/{id}/archive': ['Lưu trữ trang CMS'],
  'GET /api/admin/pages/{id}/revisions': ['Lịch sử revision của trang CMS'],
  'GET /api/post-categories': ['Danh sách chuyên mục bài viết'],
  'POST /api/admin/post-categories': ['Tạo chuyên mục bài viết'],
  'PATCH /api/admin/post-categories/{id}': ['Cập nhật chuyên mục bài viết'],
  'GET /api/post-tags': ['Danh sách thẻ bài viết'],
  'POST /api/admin/post-tags': ['Tạo thẻ bài viết'],
  'PATCH /api/admin/post-tags/{id}': ['Cập nhật thẻ bài viết'],
  'GET /api/policies/current': ['Chính sách đang hiệu lực'],

  // coupons
  'POST /api/coupons/preview': ['Xem trước số tiền giảm của coupon'],
  'GET /api/coupons': ['Danh sách coupon'],
  'POST /api/coupons': ['Tạo coupon'],
  'PUT /api/coupons/{id}': ['Cập nhật coupon'],
  'DELETE /api/coupons/{id}': ['Xoá coupon'],

  // dashboard
  'GET /api/dashboard/stats': ['Số liệu tổng quan'],

  // discovery
  'GET /api/products/facets': ['Bộ lọc khả dụng của sản phẩm'],
  'GET /api/search/suggestions': ['Gợi ý tìm kiếm'],

  // exchanges
  'POST /api/orders/{id}/exchanges': ['Tạo yêu cầu đổi hàng'],
  'GET /api/exchanges/mine': ['Yêu cầu đổi hàng của tôi'],
  'GET /api/admin/exchanges': ['Danh sách yêu cầu đổi hàng (Admin)'],
  'GET /api/exchanges/{id}': ['Chi tiết yêu cầu đổi hàng'],
  'POST /api/exchanges/{id}/approve': ['Duyệt đổi hàng'],
  'POST /api/exchanges/{id}/reject': ['Từ chối đổi hàng'],
  'POST /api/exchanges/{id}/create-replacement': [
    'Tạo đơn thay thế',
    'Gọi lặp không tạo đơn thứ hai.',
  ],

  // files
  'GET /api/files/sign-upload-url': ['Lấy URL ký upload Cloudinary'],
  'GET /api/files/sign-upload-urls': ['Lấy nhiều URL ký upload Cloudinary'],
  'POST /api/files/uploads': ['Tạo upload ticket'],
  'POST /api/files/uploads/{id}/complete': [
    'Hoàn tất upload',
    'Server kiểm tra file trên Cloudinary khớp ticket về owner, purpose và kích thước.',
  ],
  'GET /api/files/uploads/{id}': ['Xem upload ticket'],
  'GET /api/files/{id}/download': ['Tải file riêng tư'],
  'DELETE /api/files/{id}': ['Xoá file'],

  // fulfillment
  'GET /api/orders/{id}/shipments': ['Danh sách kiện hàng của đơn'],
  'POST /api/orders/{id}/shipments': [
    'Tạo kiện hàng',
    'Một đơn có thể tách nhiều kiện; không chia vượt số lượng đã đặt.',
  ],
  'POST /api/shipments/{id}/pack': ['Đóng gói kiện hàng'],
  'POST /api/shipments/{id}/ready': ['Đánh dấu sẵn sàng giao'],
  'POST /api/shipments/{id}/handover': ['Bàn giao cho đơn vị vận chuyển'],
  'POST /api/shipments/{id}/out-for-delivery': ['Đánh dấu đang giao'],
  'POST /api/shipments/{id}/deliver': [
    'Đánh dấu đã giao',
    'Với COD, giao xong chưa đồng nghĩa đã thu tiền; xác nhận riêng qua `cod-collection`.',
  ],
  'POST /api/shipments/{id}/fail': ['Đánh dấu giao thất bại'],
  'POST /api/shipments/{id}/return': ['Đánh dấu hoàn về'],
  'POST /api/shipments/{id}/lose': ['Đánh dấu thất lạc'],
  'POST /api/shipments/{id}/cancel': ['Huỷ kiện hàng'],
  'GET /api/shipments/{id}/events': ['Lịch sử trạng thái kiện hàng'],

  // inventory
  'GET /api/admin/inventory': ['Tồn kho theo SKU'],
  'GET /api/admin/inventory/movements': ['Lịch sử biến động kho'],
  'POST /api/admin/inventory/receipts': ['Nhập kho'],
  'POST /api/admin/inventory/adjustments': ['Điều chỉnh tồn kho'],
  'GET /api/admin/inventory/reconciliation': ['Đối soát tồn kho với ledger'],

  // jobs
  'GET /api/admin/jobs': ['Danh sách job nền'],
  'GET /api/admin/jobs/{id}': ['Chi tiết job nền'],
  'POST /api/admin/jobs/{id}/retry': ['Chạy lại job nền'],

  // merchandising
  'GET /api/admin/collections': ['Danh sách bộ sưu tập (Admin)'],
  'POST /api/admin/collections': ['Tạo bộ sưu tập'],
  'GET /api/admin/collections/{id}': ['Chi tiết bộ sưu tập (Admin)'],
  'PATCH /api/admin/collections/{id}': ['Cập nhật bộ sưu tập'],
  'GET /api/admin/banners': ['Danh sách banner (Admin)'],
  'POST /api/admin/banners': ['Tạo banner'],
  'GET /api/admin/banners/{id}': ['Chi tiết banner (Admin)'],
  'PATCH /api/admin/banners/{id}': ['Cập nhật banner'],
  'GET /api/collections': ['Danh sách bộ sưu tập đang hiển thị'],
  'GET /api/collections/{slug}': ['Xem bộ sưu tập'],
  'GET /api/admin/navigation/{placement}': ['Xem cấu hình điều hướng (Admin)'],
  'PATCH /api/admin/navigation/{placement}': ['Cập nhật điều hướng'],
  'GET /api/admin/home-layout': ['Xem bố cục trang chủ (Admin)'],
  'PATCH /api/admin/home-layout': ['Cập nhật bố cục trang chủ'],
  'GET /api/navigation/{placement}': ['Xem điều hướng đang hiển thị'],
  'GET /api/storefront/home': ['Dữ liệu trang chủ Storefront'],

  // notifications
  'GET /api/notifications': ['Hộp thư thông báo của tôi'],
  'GET /api/notifications/unread-count': ['Số thông báo chưa đọc'],
  'POST /api/notifications/read-all': ['Đánh dấu đã đọc tất cả'],
  'POST /api/notifications/{id}/read': ['Đánh dấu đã đọc một thông báo'],
  'GET /api/me/notification-preferences': ['Xem tuỳ chọn nhận thông báo'],
  'PATCH /api/me/notification-preferences': ['Cập nhật tuỳ chọn nhận thông báo'],
  'GET /api/admin/notification-templates': ['Danh sách mẫu thông báo'],
  'PUT /api/admin/notification-templates': ['Lưu mẫu thông báo'],

  // operations
  'GET /api/internal/metrics': ['Metrics vận hành'],
  'POST /api/admin/operations/inventory-reconciliation': ['Chạy đối soát tồn kho'],
  'GET /health': ['Kiểm tra sức khoẻ service'],
  'GET /health/live': ['Liveness probe'],
  'GET /health/ready': ['Readiness probe (kiểm tra kết nối DB)'],

  // orders
  'GET /api/orders': ['Danh sách đơn hàng (Admin)'],
  'POST /api/orders': [
    'Đặt đơn',
    'Nên gửi `quoteId` từ `POST /api/checkout/quotes`: server khoá tồn kho, kiểm tra lại quote và chống tạo đơn trùng. Luồng cũ gửi `items` theo `productId` vẫn được giữ cho client hiện tại; khi có `quoteId` các field khác bị bỏ qua.',
  ],
  'GET /api/orders/mine': ['Đơn hàng của tôi'],
  'GET /api/orders/{id}': ['Chi tiết đơn hàng'],
  'POST /api/orders/{id}/cancel': ['Huỷ đơn'],
  'POST /api/orders/{id}/refunds': [
    'Tạo yêu cầu hoàn tiền',
    'Chỉ tạo yêu cầu `pending`; tiền và tồn kho được xử lý ở bước riêng.',
  ],
  'POST /api/orders/{id}/confirm': ['Xác nhận đơn'],
  'POST /api/orders/{id}/start-processing': ['Bắt đầu xử lý đơn'],
  'GET /api/orders/{id}/events': ['Lịch sử trạng thái đơn'],
  'POST /api/orders/{id}/cancellation-requests': ['Yêu cầu huỷ một phần hoặc toàn bộ đơn'],
  'GET /api/cancellation-requests/{id}': ['Xem yêu cầu huỷ'],
  'POST /api/cancellation-requests/{id}/approve': ['Duyệt yêu cầu huỷ'],
  'POST /api/cancellation-requests/{id}/reject': ['Từ chối yêu cầu huỷ'],

  // payments
  'POST /api/orders/{id}/payment-attempts': ['Tạo lần thanh toán'],
  'GET /api/orders/{id}/payments': ['Danh sách lần thanh toán của đơn'],
  'POST /api/admin/payments/{id}/reconcile': ['Đối soát lần thanh toán với provider'],
  'POST /api/admin/payments/{id}/cod-collection': ['Xác nhận đã thu tiền COD'],
  'POST /api/payments/{id}/mock-pay': ['Giả lập thanh toán (mock)', 'Chỉ có ngoài production.'],
  'POST /api/payments/webhook/stripe': [
    'Webhook Stripe',
    'Yêu cầu raw body và `Stripe-Signature`. Event trùng được bỏ qua.',
  ],

  // processes
  'POST /api/admin/imports/{resource}': [
    'Tải file import (CSV/XLSX)',
    'Worker kiểm tra file và trả preview; dữ liệu chỉ được ghi sau `confirm`.',
  ],
  'GET /api/admin/import-templates/{resource}': ['Tải file mẫu import'],
  'POST /api/admin/exports': ['Tạo job export (CSV/XLSX)'],
  'POST /api/files/uploads/batch': ['Tạo upload ticket cho nhiều file'],
  'POST /api/files/uploads/batch/complete': [
    'Hoàn tất upload nhiều file',
    'Worker kiểm tra từng file; file lỗi không ảnh hưởng các file còn lại.',
  ],
  'GET /api/processes': ['Danh sách process của tôi'],
  'GET /api/processes/{id}': ['Xem trạng thái process'],
  'GET /api/processes/{id}/items': ['Kết quả và lỗi từng dòng/từng file'],
  'POST /api/processes/{id}/confirm': ['Xác nhận áp dụng import'],
  'POST /api/processes/{id}/cancel': ['Huỷ process'],
  'GET /api/processes/{id}/download': ['Tải file kết quả của process'],

  // products
  'GET /api/products': ['Danh sách sản phẩm'],
  'POST /api/products': ['Tạo sản phẩm'],
  'GET /api/products/{id}': ['Chi tiết sản phẩm'],
  'PUT /api/products/{id}': ['Cập nhật sản phẩm'],
  'DELETE /api/products/{id}': ['Xoá sản phẩm'],
  'GET /api/products/{id}/reviews': ['Danh sách đánh giá của sản phẩm'],
  'POST /api/products/{id}/reviews': ['Đánh giá sản phẩm (luồng cũ)'],
  'DELETE /api/products/{id}/reviews/{reviewId}': ['Xoá đánh giá'],
  'POST /api/products/{id}/images': ['Thêm ảnh sản phẩm'],
  'DELETE /api/products/{id}/images/{imageId}': ['Xoá ảnh sản phẩm'],

  // promotions
  'GET /api/admin/promotions': ['Danh sách khuyến mãi'],
  'POST /api/admin/promotions': ['Tạo khuyến mãi'],
  'GET /api/admin/promotions/{id}': ['Chi tiết khuyến mãi'],
  'PATCH /api/admin/promotions/{id}': ['Cập nhật khuyến mãi'],
  'GET /api/admin/coupons/{id}': ['Chi tiết coupon'],
  'GET /api/admin/coupons/{id}/redemptions': ['Lịch sử dùng coupon'],

  // refunds
  'GET /api/refunds': ['Danh sách hoàn tiền'],
  'GET /api/refunds/{id}': ['Chi tiết hoàn tiền'],
  'POST /api/admin/refunds/{id}/reconcile': ['Đối soát hoàn tiền với provider'],
  'POST /api/admin/refunds/{id}/retry': [
    'Chạy lại hoàn tiền thất bại',
    'Chỉ áp dụng khi provider đã xác nhận thất bại; trường hợp chưa rõ kết quả phải đối soát trước.',
  ],
  'POST /api/admin/refunds/{id}/manual-confirmation': ['Xác nhận đã chuyển khoản hoàn tiền'],

  // reports
  'GET /api/admin/reports/sales': ['Báo cáo doanh thu'],
  'GET /api/admin/reports/orders': ['Báo cáo đơn hàng'],
  'GET /api/admin/reports/inventory': ['Báo cáo tồn kho'],
  'GET /api/admin/reports/products': ['Báo cáo sản phẩm'],
  'POST /api/admin/report-exports': ['Tạo file export báo cáo'],
  'GET /api/admin/report-exports/{id}': ['Xem trạng thái export báo cáo'],
  'GET /api/admin/report-exports/{id}/download': ['Tải file export báo cáo'],

  // returns
  'POST /api/orders/{id}/returns': ['Tạo yêu cầu trả hàng'],
  'GET /api/returns/mine': ['Yêu cầu trả hàng của tôi'],
  'GET /api/admin/returns': ['Danh sách yêu cầu trả hàng (Admin)'],
  'GET /api/returns/{id}': ['Chi tiết yêu cầu trả hàng'],
  'POST /api/returns/{id}/approve': ['Duyệt trả hàng'],
  'POST /api/returns/{id}/reject': ['Từ chối trả hàng'],
  'POST /api/returns/{id}/in-transit': ['Đánh dấu hàng trả đang về'],
  'POST /api/returns/{id}/receive': ['Đánh dấu đã nhận hàng trả'],
  'POST /api/returns/{id}/inspect': [
    'Kiểm tra hàng trả',
    'Chỉ số lượng `saleableQuantity` được cộng lại tồn kho.',
  ],
  'POST /api/returns/{id}/complete': ['Hoàn tất trả hàng'],

  // reviews
  'POST /api/order-items/{id}/reviews': [
    'Đánh giá sản phẩm đã mua',
    'Item phải đã giao và thuộc người mua; đánh giá chờ kiểm duyệt.',
  ],
  'PATCH /api/reviews/{id}': ['Sửa đánh giá của tôi'],
  'POST /api/reviews/{id}/moderation': ['Kiểm duyệt đánh giá'],
  'PUT /api/reviews/{id}/reply': ['Phản hồi đánh giá'],
  'POST /api/reviews/{id}/reports': ['Báo cáo đánh giá vi phạm'],
  'GET /api/admin/reviews': ['Danh sách đánh giá (Admin)'],
  'GET /api/products/{id}/review-summary': ['Tổng hợp điểm đánh giá của sản phẩm'],

  // settings
  'GET /api/shop/config': ['Cấu hình shop công khai'],
  'GET /api/admin/settings/shop': ['Xem cấu hình shop'],
  'PATCH /api/admin/settings/shop': ['Cập nhật cấu hình shop'],
  'GET /api/admin/settings/commerce': ['Xem cấu hình thương mại'],
  'PATCH /api/admin/settings/commerce': ['Cập nhật cấu hình thương mại'],
  'GET /api/admin/shipping-methods': ['Danh sách phương thức vận chuyển'],
  'POST /api/admin/shipping-methods': ['Tạo phương thức vận chuyển'],
  'GET /api/admin/shipping-methods/{id}': ['Chi tiết phương thức vận chuyển'],
  'PATCH /api/admin/shipping-methods/{id}': ['Cập nhật phương thức vận chuyển'],
  'POST /api/shipping/quotes': ['Tính phí vận chuyển'],

  // staff
  'GET /api/admin/roles': ['Danh sách vai trò và quyền'],
  'GET /api/admin/staff': ['Danh sách nhân viên'],
  'GET /api/admin/customers': ['Danh sách khách hàng'],
  'POST /api/admin/staff/invitations': ['Mời nhân viên'],
  'POST /api/staff/invitations/accept': ['Chấp nhận lời mời nhân viên'],
  'PATCH /api/admin/staff/{id}/role': ['Đổi vai trò nhân viên'],
  'PATCH /api/admin/staff/{id}/status': ['Đổi trạng thái nhân viên'],
  'PATCH /api/admin/customers/{id}/status': ['Đổi trạng thái khách hàng'],

  // support
  'POST /api/support/tickets': ['Tạo ticket hỗ trợ'],
  'GET /api/support/tickets/mine': ['Ticket của tôi'],
  'GET /api/admin/support/tickets': ['Danh sách ticket (Admin)'],
  'GET /api/support/tickets/{id}': ['Chi tiết ticket'],
  'GET /api/support/tickets/{id}/messages': [
    'Tin nhắn của ticket',
    'Khách không thấy ghi chú nội bộ.',
  ],
  'POST /api/support/tickets/{id}/messages': ['Gửi tin nhắn vào ticket'],
  'POST /api/admin/support/tickets/{id}/assign': ['Phân công ticket'],
  'POST /api/support/tickets/{id}/close': ['Đóng ticket'],

  // system
  'GET /api/me/capabilities': ['Quyền của tôi'],
  'GET /api/admin/system/contracts': ['Contract trạng thái của hệ thống'],

  // wishlist
  'GET /api/wishlist': ['Danh sách yêu thích của tôi'],
  'PUT /api/wishlist/items/{productId}': ['Thêm sản phẩm vào yêu thích'],
  'DELETE /api/wishlist/items/{productId}': ['Bỏ sản phẩm khỏi yêu thích'],
  'POST /api/stock-alert-subscriptions': ['Đăng ký báo còn hàng'],
  'GET /api/stock-alert-subscriptions/mine': ['Đăng ký báo còn hàng của tôi'],
  'DELETE /api/stock-alert-subscriptions/{id}': ['Huỷ đăng ký báo còn hàng'],
};

const uuid = { type: 'string', format: 'uuid' };
const quantity = { type: 'integer', minimum: 1, maximum: 99 };
const arrayOf = (items, limits = {}) => ({ type: 'array', items, ...limits });
const object = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
});

const MERCHANDISING_ONLY = {
  collection: {
    title: { schema: { type: 'string', minLength: 1, maxLength: 200 }, required: true },
    productIds: {
      schema: arrayOf({ type: 'string', maxLength: 128 }, { maxItems: 100 }),
      required: true,
    },
  },
  banner: {
    title: { schema: { type: 'string', minLength: 1, maxLength: 200 }, required: true },
    imageFileId: { schema: { type: 'string', minLength: 1, maxLength: 36 }, required: true },
    href: { schema: { type: 'string', minLength: 1, maxLength: 1000 }, required: true },
    placement: { schema: { type: 'string', enum: ['home', 'shop'] }, required: true },
  },
  navigation: {
    items: {
      schema: arrayOf({ ref: 'NavigationItem' }, { maxItems: 30 }),
      required: true,
    },
  },
  home: {
    sections: {
      schema: arrayOf(
        object({
          id: { type: 'string' },
          type: { type: 'string', enum: ['banner', 'collection'] },
          entryId: { type: 'string' },
        }),
        { maxItems: 30 },
      ),
      required: true,
    },
  },
};
const MERCHANDISING_FIELDS = [
  'title',
  'productIds',
  'imageFileId',
  'href',
  'placement',
  'items',
  'sections',
];
const merchandising = (kind) => ({
  omit: MERCHANDISING_FIELDS,
  fields: MERCHANDISING_ONLY[kind],
});

const contentBody = {
  fields: {
    body: { schema: arrayOf({ ref: 'ContentBlock' }), required: true },
  },
};
const noInspection = { omit: ['inspection'] };
const measurements = {
  fields: {
    measurements: {
      schema: arrayOf(
        {
          type: 'object',
          properties: { size: { type: 'string', maxLength: 80 } },
          required: ['size'],
          additionalProperties: { type: 'number', exclusiveMinimum: 0, maximum: 1000 },
        },
        { minItems: 1, maxItems: 100 },
      ),
      required: true,
    },
  },
};

const reportRange = {
  parameters: [
    {
      name: 'from',
      in: 'query',
      required: true,
      description: 'Thời điểm bắt đầu theo UTC, ví dụ 2026-01-01T00:00:00Z.',
      schema: { type: 'string', format: 'date-time' },
    },
    {
      name: 'to',
      in: 'query',
      required: true,
      description: 'Thời điểm kết thúc theo UTC, sau `from` và cách tối đa 366 ngày.',
      schema: { type: 'string', format: 'date-time' },
    },
    {
      name: 'timezone',
      in: 'query',
      description: 'Múi giờ IANA để nhóm dữ liệu.',
      schema: { type: 'string', default: 'UTC' },
    },
  ],
};

const facetCount = object({ value: { type: 'string' }, count: { type: 'integer' } });
const discrepancies = {
  responseFields: { discrepancies: arrayOf(object({ id: { type: 'string' } })) },
};

export const OVERRIDES = {
  'GET /api/products/facets': {
    responseFields: {
      sizes: arrayOf(facetCount),
      colors: arrayOf(facetCount),
      categories: arrayOf(
        object({ id: { type: 'string' }, name: { type: 'string' }, count: { type: 'integer' } }),
      ),
    },
  },
  'GET /api/navigation/{placement}': {
    response: object({ placement: { type: 'string' }, items: arrayOf({ ref: 'NavigationItem' }) }),
  },
  'GET /api/admin/jobs/{id}': {
    responseFields: {
      attempts: arrayOf(
        object({
          id: { type: 'string' },
          attempt: { type: 'integer' },
          status: { type: 'string' },
          error_code: { type: ['string', 'null'] },
          created_at: { type: 'string', format: 'date-time' },
        }),
      ),
    },
  },
  'GET /api/admin/inventory/reconciliation': discrepancies,
  'POST /api/admin/operations/inventory-reconciliation': discrepancies,
  'GET /api/admin/system/contracts': {
    responseFields: {
      transitions: {
        type: 'object',
        description:
          'Theo từng loại: map từ trạng thái hiện tại sang các trạng thái được chuyển tới.',
        additionalProperties: {
          type: 'object',
          additionalProperties: arrayOf({ type: 'string' }),
        },
      },
    },
  },
  'GET /api/admin/reports/sales': reportRange,
  'GET /api/admin/reports/orders': reportRange,
  'GET /api/admin/reports/inventory': reportRange,
  'GET /api/admin/reports/products': reportRange,
  'POST /api/admin/exports': {
    fields: {
      query: {
        schema: {
          type: 'object',
          description: 'Bộ lọc theo allowlist của từng resource; field lạ bị từ chối.',
          additionalProperties: { type: ['string', 'number', 'boolean', 'null'] },
        },
      },
    },
  },
  'POST /api/orders/{id}/exchanges': {
    fields: {
      items: {
        schema: arrayOf(object({ orderItemId: uuid, variantId: uuid, quantity }), {
          minItems: 1,
          maxItems: 100,
        }),
        required: true,
      },
    },
  },
  'POST /api/admin/collections': merchandising('collection'),
  'PATCH /api/admin/collections/{id}': merchandising('collection'),
  'POST /api/admin/banners': merchandising('banner'),
  'PATCH /api/admin/banners/{id}': merchandising('banner'),
  'PATCH /api/admin/navigation/{placement}': merchandising('navigation'),
  'PATCH /api/admin/home-layout': merchandising('home'),
  'POST /api/admin/posts': contentBody,
  'PATCH /api/admin/posts/{id}': contentBody,
  'POST /api/admin/pages': contentBody,
  'PATCH /api/admin/pages/{id}': contentBody,
  'POST /api/returns/{id}/approve': noInspection,
  'POST /api/returns/{id}/reject': noInspection,
  'POST /api/returns/{id}/in-transit': noInspection,
  'POST /api/returns/{id}/receive': noInspection,
  'POST /api/returns/{id}/complete': noInspection,
  'POST /api/returns/{id}/inspect': {
    fields: {
      inspection: {
        schema: arrayOf({ ref: 'ReturnInspection' }, { maxItems: 100 }),
        required: true,
      },
    },
  },
  'POST /api/cart/items': {
    fields: {
      variantId: { schema: uuid, required: true },
      quantity: { schema: quantity, required: true },
    },
  },
  'POST /api/admin/size-guides': measurements,
  'PATCH /api/admin/size-guides/{id}': measurements,
  'POST /api/orders': {
    fields: {
      quoteId: { schema: { type: 'string', maxLength: 36 } },
      items: {
        schema: arrayOf(object({ productId: { type: 'string' }, quantity })),
      },
      shippingAddress: { schema: { ref: 'ShippingAddressInput' } },
    },
  },
  'GET /api/admin/roles': {
    response: {
      type: 'object',
      description: 'Map từ vai trò sang danh sách quyền.',
      additionalProperties: arrayOf({ type: 'string' }),
    },
  },
};
