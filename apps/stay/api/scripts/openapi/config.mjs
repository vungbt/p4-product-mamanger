/**
 * OpenAPI generator config of @stay/api for apps/api/scripts/openapi/generate.mjs:
 *   pnpm --filter @stay/api openapi:generate | openapi:check
 *
 * OPERATIONS: 'METHOD /path': [summary, optional business note]
 * OVERRIDES:  'METHOD /path': { fields, omit, requestBody, response, responseFields, list, parameters }
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const API_DESCRIPTION = `API quản lý nhà trọ Stay.

## Xác thực
Đăng nhập qua \`POST /api/auth/sign-in/email\` (Better Auth). Trình duyệt dùng cookie HttpOnly
\`stay.session_token\`; client khác gửi \`Authorization: Bearer <token>\`. Không có đăng ký công khai:
tài khoản do chủ trọ tạo. Quyền của người dùng hiện tại lấy từ \`GET /api/me/capabilities\` (rule CASL).

## Quy ước chung
- Response thành công có dạng \`{ data, message? }\`, danh sách có thêm \`meta\` phân trang.
- Tiền là số nguyên VND. Kỳ dạng \`YYYY-MM\`, ngày nghiệp vụ \`YYYY-MM-DD\` theo Asia/Ho_Chi_Minh.
- \`X-Request-Id\` có trong mọi response, dùng khi báo lỗi.
- Mọi dữ liệu nghiệp vụ gắn \`buildingId\`; quyền kiểm tra theo toà.`;

const TAG_DESCRIPTIONS = {
  maintenance: 'Bảo trì theo phòng; mở → đang làm → xong/huỷ, ảnh private và chi phí ST-20.',
  members:
    'Người quản lý theo toà: mời qua email, gán toà/nhóm quyền và khoá tài khoản; chỉ chủ trọ.',
  automation:
    'Tự động hoá theo toà, chỉ tạo bản nháp; nhắc qua email và thông báo. Nhắc chủ trọ trước ngày chốt số `readingReminderDaysBefore` ngày (0 = tắt) và vào ngày chốt số, chỉ khi còn phòng thiếu chỉ số. Nhắc người thuê trước hạn 1 ngày và sau hạn 3 ngày, hoặc vào ngày đầu tiên quá hạn khi toà có `graceDays` > 0.',
  notifications:
    'Thông báo trong ứng dụng (nhân viên theo toà, người thuê theo hợp đồng), luồng SSE, email SMTP và thông báo trình duyệt (Web Push) gửi qua outbox sau commit; cài đặt kênh/nhóm sự kiện theo người.',
  residents: 'Tạm trú theo ngày, khai báo theo lần ở và xuất Excel có audit.',
  reports:
    'Báo cáo tổng hợp SQL theo tháng, theo phòng, điện nước và xuất sổ Excel. Chỉ đọc, có phân quyền theo toà.',
  deposits: 'Sổ cọc bất biến; thu thêm, hoàn, mất cọc và cấn trừ thanh lý.',
  readings:
    'Chốt chỉ số điện nước, lưu theo dòng và thay đồng hồ; tiêu thụ tính theo các đoạn đồng hồ.',
  expenses: 'Chi phí vận hành, danh mục chi phí và tổng theo kỳ. Ảnh hoá đơn lưu private.',
  contracts:
    'Hợp đồng thuê, kích hoạt (tạo hoá đơn nhận phòng nháp), huỷ bản nháp, xem trước tiền nhận phòng, báo trả phòng và thanh lý (ST-17).',
  invoices:
    'Hoá đơn: xem trước và tạo bản nháp kỳ M (tiền phòng + dịch vụ M, điện nước M−1), phụ thu/giảm trừ, phát hành (cấp mã, khoá chỉ số), void. Mọi số tiền tính bằng `@stay/billing` tại server; dòng hoá đơn là snapshot.',
  payments:
    'Thu tiền hoá đơn (một hoặc nhiều lần), sổ thu và huỷ bút toán thu. Thanh toán không sửa/xoá; `paidTotal` và trạng thái hoá đơn luôn tính lại từ tổng các khoản chưa huỷ trong cùng transaction.',
  receivables:
    'Công nợ theo hợp đồng: hoá đơn đã phát hành chưa thu đủ, tổng còn lại, quá hạn theo `dueOn` và ngày hiện tại Asia/Ho_Chi_Minh (nhóm chưa tới hạn, 1–7, 8–30, > 30 ngày). Chỉ đọc.',
  overview:
    'Tổng quan tháng: phải thu/đã thu/còn lại của kỳ, công nợ, phòng theo trạng thái, tỷ lệ lấp đầy, 6 kỳ gần nhất và việc cần làm. Tổng hợp ở server, chỉ đọc.',
  audit: 'Lịch sử thay đổi đã ẩn dữ liệu nhạy cảm.',
  portal:
    'Cổng người thuê (ST-25): link riêng cho từng người ở (chủ trọ tạo/thu hồi) và các route `/api/portal/*` cho người thuê không cần tài khoản. Vào cổng bằng token của link + 4 số cuối SĐT → cookie phiên cổng HttpOnly `stay_portal_session` (production `__Secure-stay_portal_session`, path `/api/portal`, 90 ngày). Cookie phiên nhân viên (`stay.session_token`) không dùng được ở cổng và cookie cổng không dùng được ở route nhân viên. Mọi dữ liệu chỉ thuộc hợp đồng của link; người ở cùng chỉ hiện tên viết tắt.',
  buildings: 'Toà nhà, kỳ thu và tài khoản nhận tiền theo toà, đơn giá ghi đè theo ngày.',
  requests:
    'Hộp "Yêu cầu từ người thuê" (O-26, ST-25): báo hỏng, yêu cầu thay đổi hợp đồng và báo chuyển khoản từ cổng người thuê. Người thuê chỉ đề nghị; duyệt yêu cầu gọi đúng thao tác ST-12/ST-17 trong cùng transaction, xác nhận chuyển khoản tạo khoản thu ST-15. Audit chỉ ghi id và trạng thái.',
  announcements:
    'Thông báo cho người thuê (O-32): cả toà hoặc một số phòng, ghim, ngày hết hạn hiển thị. Cổng người thuê chỉ hiện thông báo còn hạn của toà/phòng mình.',
  me: 'Người dùng hiện tại và quyền CASL.',
  operations: 'Kiểm tra trạng thái dịch vụ.',
  rooms:
    'Phòng theo toà, sơ đồ phòng, tạo nhanh nhiều phòng, đồng hồ điện/nước và bảo trì. Trạng thái phòng suy ra từ hợp đồng.',
  settings: 'Cấu hình hệ thống: kỳ thu mặc định và danh mục dịch vụ, đơn giá mặc định.',
  tenants:
    'Hồ sơ người thuê, ảnh CCCD (private), xe và import từ CSV/XLSX. Dữ liệu cá nhân: chỉ chủ trọ và người quản lý toà của người thuê được xem; CCCD che giữa, không ghi rõ vào log/audit.',
  uploads:
    'Tải ảnh private (CCCD): xin ticket → gửi file thẳng tới `uploadUrl` → `complete` → gắn `fileId`. Ảnh chỉ xem qua URL ký ngắn hạn.',
};

const BILLING_DAY_NOTE =
  'Ngày trong tháng `1`–`28`, hoặc `31` = cuối tháng. Hạn thanh toán phải ≥ ngày phát hành. `readingDayMonth`: `same` = ngày chốt số thuộc tháng tiêu thụ M−1, `next` = thuộc tháng M (khi đó ngày chốt số ≤ ngày phát hành, 422 `reading_after_issue`). `graceDays` 0–31: hoá đơn chỉ tính quá hạn sau `dueOn + graceDays`.';
const VERSION_NOTE =
  'Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.';

const TENANT_FIELDS_NOTE =
  'Chỉ bắt buộc `fullName` và `phone` (10 số, bắt đầu 0; nhận cả `+84`, khoảng trắng, dấu chấm và tự chuẩn hoá). CCCD 12 số, duy nhất toàn hệ thống: trùng → 400 với `extensions.idNumber` và `extensions.duplicateTenant` (`tenantId` chỉ có khi người dùng được xem hồ sơ đó). Ngày dạng `YYYY-MM-DD` (hoặc `dd/MM/yyyy`), không sau hôm nay. Không tự điền giá trị nào.';

/** Server-Sent Events (GET): `event: notification` with a `NotificationStreamEvent` JSON. */
export const EVENT_STREAM_RESPONSES = Object.fromEntries(
  ['/api/notifications/stream', '/api/portal/notifications/stream'].map((url) => [
    url,
    {
      description:
        'Luồng `text/event-stream`: `event: ready` khi mở, `event: notification` với `data` là `NotificationStreamEvent` (JSON), comment `: ping` mỗi 25 giây. Server đóng luồng sau 10 phút; EventSource tự kết nối lại.',
      content: { 'text/event-stream': { schema: { type: 'string' } } },
    },
  ]),
);

export const FILE_RESPONSES = {
  '/api/buildings/{buildingId}/residents/export': {
    description: 'Danh sách tạm trú XLSX; audit trước khi trả dữ liệu cá nhân.',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  },
};

const OPERATIONS = {
  'GET /api/maintenance/expense-categories': ['Danh mục chi phí cho bảo trì'],
  'GET /api/maintenance': ['Danh sách bảo trì theo toà/phòng/trạng thái/nguồn'],
  'GET /api/maintenance/{id}': ['Chi tiết bảo trì, ảnh, lịch sử và chi phí'],
  'POST /api/maintenance': [
    'Tạo việc bảo trì',
    'create Maintenance trong toà; nguồn owner, trạng thái open.',
  ],
  'PUT /api/maintenance/{id}': [
    'Sửa việc bảo trì',
    'update Maintenance trong toà. new → open → in_progress → done/cancelled; sai thứ tự hoặc version cũ trả 409.',
  ],
  'POST /api/maintenance/{id}/expense': [
    'Ghi chi phí sửa chữa',
    'update Maintenance và create Expense trong toà. Một khoản chi mỗi việc; trùng trả 409. Toà/phòng lấy từ việc.',
  ],
  'GET /api/members': ['Người quản lý theo toà'],
  'POST /api/members/invitations': [
    'Mời người quản lý',
    'Tạo tài khoản và xếp lời mời vào outbox; không nâng quyền tài khoản đã tồn tại.',
  ],
  'PUT /api/members/{id}': ['Gán toà và quyền', VERSION_NOTE],
  'POST /api/members/{id}/disable': ['Khoá người quản lý và thu hồi mọi phiên'],
  'GET /api/buildings/{id}/automation': [
    'Cấu hình tự động hoá',
    'Chỉ toà được phép đọc. Mặc định tắt các job và tắt toàn bộ nhắc người thuê.',
  ],
  'PUT /api/buildings/{id}/automation': [
    'Lưu tự động hoá',
    'manage Building; gửi đủ năm cờ và version (`readingReminderBefore`, `readingReminderDaysBefore` 0–10 bỏ trống = tắt/1 ngày); stale version trả 409, có audit.',
  ],
  'GET /api/notifications/stream': [
    'Luồng thông báo (SSE)',
    'Server-Sent Events của thông báo nhân viên mới trong các toà được phép đọc (đánh thức bằng Postgres NOTIFY sau commit). Client giữ polling `GET /api/notifications` làm dự phòng.',
  ],
  'GET /api/me/notification-settings': [
    'Cài đặt nhận thông báo',
    'Kênh email/trình duyệt và nhóm sự kiện bị tắt của người dùng hiện tại (mặc định bật hết), kèm `emailAvailable`, `pushPublicKey` (VAPID, null khi chưa cấu hình) và số thiết bị đã đăng ký.',
  ],
  'PUT /api/me/notification-settings': [
    'Lưu cài đặt nhận thông báo',
    '`{ email, push, mutedGroups }`. Thông báo trong ứng dụng luôn được ghi; cài đặt chỉ áp dụng cho email và thông báo trình duyệt. Có audit.',
  ],
  'POST /api/me/push-subscriptions': [
    'Đăng ký thông báo trình duyệt',
    '`PushSubscription.toJSON()` của trình duyệt. Endpoint phải thuộc dịch vụ push của trình duyệt (HTTPS). Idempotent theo endpoint; cùng trình duyệt đăng nhập người khác thì chuyển sang người đó.',
  ],
  'DELETE /api/me/push-subscriptions': [
    'Huỷ đăng ký thông báo trình duyệt',
    '`{ endpoint }`; chỉ xoá endpoint của chính người dùng. Không có thì không làm gì.',
  ],
  'GET /api/portal/notifications': [
    'Thông báo của người thuê',
    '50 thông báo mới nhất của hợp đồng trong phiên (cả hợp đồng hoặc riêng người ở này) và `unreadCount`.',
  ],
  'POST /api/portal/notifications/{id}/read': [
    'Người thuê đánh dấu đã đọc',
    'Idempotent; thông báo của hợp đồng khác → 404.',
  ],
  'GET /api/portal/notifications/stream': [
    'Luồng thông báo người thuê (SSE)',
    'Server-Sent Events chỉ của hợp đồng trong phiên cổng; không bao giờ nhận thông báo của hợp đồng/người khác.',
  ],
  'GET /api/portal/notification-settings': [
    'Cài đặt nhận thông báo (người thuê)',
    'Như `/api/me/notification-settings`, theo người thuê của phiên. Email chỉ gửi khi hồ sơ có email.',
  ],
  'PUT /api/portal/notification-settings': ['Lưu cài đặt nhận thông báo (người thuê)', 'Có audit.'],
  'POST /api/portal/push-subscriptions': [
    'Người thuê đăng ký thông báo trình duyệt',
    'Gắn với link cổng của phiên: thu hồi link thì dừng gửi, xoá link thì xoá đăng ký.',
  ],
  'DELETE /api/portal/push-subscriptions': [
    'Người thuê huỷ đăng ký thông báo trình duyệt',
    '`{ endpoint }` của link trong phiên.',
  ],
  'GET /api/notifications': [
    'Thông báo nhân viên',
    '50 thông báo mới nhất trong các toà được phép đọc; unreadCount tính tất cả. Đã đọc riêng từng người.',
  ],
  'POST /api/notifications/{id}/read': [
    'Đánh dấu đã đọc',
    'Idempotent, chỉ trong toà được phép đọc; có audit.',
  ],
  'GET /api/buildings/{buildingId}/residents': [
    'Danh sách tạm trú',
    'Người ở của hợp đồng active/ending tại date; fromDate bao gồm, toDate không bao gồm. CCCD đầy đủ chỉ dành cho nhân viên có read Tenant trong toà. Không ghi audit dữ liệu cá nhân.',
  ],
  'POST /api/resident-stays/{id}/registration': [
    'Đánh dấu đã khai báo',
    'manage Tenant; id là contract_occupants.id. Ngày từ ngày đến tới hôm nay; audit chỉ chứa id, toà và trạng thái.',
  ],
  'DELETE /api/resident-stays/{id}/registration': [
    'Bỏ đánh dấu khai báo',
    'manage Tenant; chỉ cập nhật lần ở này.',
  ],
  'POST /api/buildings/{buildingId}/residents/export': [
    'Xuất danh sách tạm trú Excel',
    'read Tenant; 10 lần/phút; ngoài phạm vi trả 404. Audit người xuất, thời điểm, toà, ngày và số dòng; không chứa dữ liệu cá nhân.',
  ],
  'GET /api/reports/revenue': [
    'Doanh thu, chi phí và lãi/lỗ',
    'Phải thu theo kỳ hoá đơn; đã thu theo ngày thu thực tế (gồm deposit); bỏ nháp, void và thanh toán huỷ. Khoảng tối đa 24 tháng. Chỉ đọc; ngoài phạm vi quản lý trả 404.',
  ],
  'GET /api/reports/rooms': [
    'Báo cáo theo phòng',
    'Cả năm; số ngày ở tính cả ngày nhận và trả phòng, theo lịch sử chuyển phòng.',
  ],
  'GET /api/reports/utilities': [
    'Báo cáo điện nước',
    'Theo kỳ tiêu thụ của dòng hoá đơn. Danh mục Điện tổng / Nước tổng khớp tên sau trim, không phân biệt hoa thường; Điện nước tổng được báo riêng. Hao hụt tiền = (chi − phải thu) / chi × 100; null khi không có chi.',
  ],
  'POST /api/reports/exports': [
    'Xuất sổ Excel',
    'XLSX nhị phân, attachment. Tối đa 24 tháng; 5 lần/phút. Hoá đơn và công nợ theo kỳ hoá đơn (công nợ hiện tại của kỳ); sổ thu theo ngày thu; chi phí theo kỳ chi. Chỉ đọc, không ghi audit changes.',
  ],
  'GET /api/deposits': ['Sổ cọc', 'Tổng theo toàn bộ bộ lọc trước phân trang.'],
  'GET /api/contracts/{id}/deposits': ['Lịch sử bút toán cọc'],
  'POST /api/contracts/{id}/deposits': [
    'Thêm bút toán cọc',
    'Bất biến; số dư âm trả 422; applied chỉ dành cho ST-17.',
  ],
  'GET /api/buildings/{buildingId}/readings': [
    'Chỉ số điện nước toàn toà',
    'Kỳ là tháng tiêu thụ (YYYY-MM). `readOnFrom`/`readOnTo` là khoảng ngày đọc hợp lệ theo kỳ thu của toà (`readingDayMonth`), `readingOn` là ngày chốt số của kỳ. Bao gồm phòng có hợp đồng active/ending, chỉ số trước, tiêu thụ cả hai đoạn khi thay đồng hồ, trung bình tối đa 3 kỳ trước, cảnh báo và trạng thái draft/locked. Ngoài phạm vi quản lý trả 404.',
  ],
  'PUT /api/buildings/{buildingId}/readings': [
    'Lưu chỉ số theo dòng',
    'Mỗi dòng gửi meterId, period, reading, readOn và version (0 khi tạo). `readOn` phải trong tháng tiêu thụ (`same`) hoặc từ ngày 1 của kỳ tới ngày chốt số tháng sau (`next`), sai trả lỗi dòng 422 tại `readOn`. Trả results theo thứ tự đầu vào; dòng lỗi không huỷ dòng hợp lệ. Chỉ số nguyên không âm; số mới nhỏ hơn số cũ bị chặn. Tiêu thụ hơn 2 lần trung bình cần confirmHighConsumption. Version cũ trả lỗi dòng 409; locked không sửa được. Ảnh dùng private upload purpose contract_meter.',
  ],
  'PUT /api/readings/{id}': [
    'Sửa chỉ số draft',
    'Gửi đủ dữ liệu chỉ số và version; meterId/period không được đổi. 409 khi stale hoặc locked.',
  ],
  'POST /api/meters/{id}/replace': [
    'Thay đồng hồ',
    'Đóng đồng hồ cũ bằng finalReading và replacedOn, mở đồng hồ cùng loại với initialReading và serial mới. Giữ lịch sử để tính hai đoạn trong kỳ thay. Idempotency-Key tuỳ chọn; retry cùng nội dung trả cùng id đồng hồ mới.',
  ],
  'GET /api/expense-categories': [
    'Danh mục chi phí',
    'Gồm các danh mục đã tắt. Chỉ tắt thay vì xoá để giữ lịch sử.',
  ],
  'POST /api/expense-categories': ['Thêm danh mục chi phí'],
  'PUT /api/expense-categories/{id}': ['Sửa hoặc tắt danh mục chi phí', VERSION_NOTE],
  'GET /api/expenses': [
    'Chi phí vận hành',
    'Lọc buildingId, period, categoryId, roomId. meta.totalsByCategory tính trên toàn bộ kết quả lọc, trước phân trang.',
  ],
  'POST /api/expenses': [
    'Thêm chi phí',
    'Số nguyên VND > 0; kỳ suy ra từ ngày chi theo Asia/Ho_Chi_Minh. Ảnh private cùng toà, purpose expense_receipt.',
  ],
  'PUT /api/expenses/{id}': ['Sửa chi phí', VERSION_NOTE],
  'DELETE /api/expenses/{id}': ['Xoá chi phí'],
  'GET /api/contracts': [
    'Danh sách hợp đồng',
    'Lọc theo toà, phòng, trạng thái và expiring=true (hiệu lực, kết thúc trong 30 ngày).',
  ],
  'POST /api/contracts': ['Tạo bản nháp hợp đồng'],
  'GET /api/contracts/{id}': ['Chi tiết hợp đồng'],
  'PUT /api/contracts/{id}': ['Sửa bản nháp', VERSION_NOTE],
  'POST /api/contracts/{id}/activate': [
    'Kích hoạt hợp đồng',
    'Khoá phòng, kiểm tra người ở và chỉ số, ghi nhận cọc đã thu và tạo hoá đơn nhận phòng nháp (cùng cách tính với move-in-preview).',
  ],
  'POST /api/contracts/{id}/cancel': ['Huỷ bản nháp'],
  'POST /api/contracts/{id}/notice': [
    'Báo trả phòng',
    `active → ending (hoặc đổi ngày khi đang ending). \`expectedMoveOutDate\` ≥ hôm nay, ≥ ngày bắt đầu và ≤ ngày kết thúc (nếu có), lưu vào \`noticeDate\`; ghi \`note\` vào lịch sử hợp đồng (không vào audit). ${VERSION_NOTE}`,
  ],
  'POST /api/contracts/{id}/cancel-notice': [
    'Huỷ báo trả phòng',
    `ending → active, xoá \`noticeDate\`. Gia hạn (\`/renew\`) cũng huỷ báo trả. Chưa báo trả trả 409 \`contract_not_ending\`. ${VERSION_NOTE}`,
  ],
  'POST /api/contracts/{id}/settlement-preview': [
    'Xem trước thanh lý',
    'Không ghi dữ liệu; cùng phép tính với `/settle` (`computeSettlement` + `allocateSettlementDeposit` của `@stay/billing`). Điện nước từ chỉ số đã khoá gần nhất (hoặc chỉ số nhận phòng/đổi phòng) tới chỉ số cuối; tiền phòng/dịch vụ những ngày đã ở chưa có hoá đơn; hoàn tiền ngày chưa ở khi toà bật `refundUnusedRent`; phụ thu (không gửi `surcharges` → tự thêm dòng "Khấu hao cơ sở vật chất" bằng `moveOutFee` của toà, 0 = không thêm; gửi mảng, kể cả rỗng, → dùng đúng danh sách đó); nợ cũ (chỉ liệt kê); cọc đang giữ → `ownerRefunds` (chủ trọ hoàn) hoặc `tenantPays` (người thuê trả thêm). Đơn giá và số người/xe lấy tại ngày trả phòng. 409 `contract_has_draft_invoices` kèm `extensions.invoices` khi còn hoá đơn nháp; 409 `reading_after_move_out` khi đã có chỉ số sau ngày trả phòng; 422 lỗi field cho ngày/chỉ số.',
  ],
  'POST /api/contracts/{id}/settle': [
    'Thanh lý hợp đồng',
    `Chỉ chủ trọ (\`settle:Contract\`). Một transaction: khoá hợp đồng, phòng, hoá đơn; từ chối khi còn hoá đơn nháp (409 \`contract_has_draft_invoices\` kèm danh sách); tạo và phát hành hoá đơn \`settlement\` (khoá chỉ số đã dùng); cọc ghi thành thanh toán phương thức \`deposit\` trên đúng hoá đơn được trả (nợ cũ trước, rồi hoá đơn thanh lý) kèm bút toán cọc \`applied\`; phần còn lại hoàn bằng bút toán \`refunded\` (\`refundMethod\`, ngày hôm nay); cọc không đủ thì phần thiếu còn nợ trên hoá đơn; hợp đồng → ended (\`movedOutAt\`), người ở/xe/dịch vụ kết thúc từ ngày sau ngày trả phòng, phòng về trống. Số liệu trùng với bản xem trước. ${VERSION_NOTE}`,
  ],
  'GET /api/contracts/{id}/move-in-preview': [
    'Xem trước tiền nhận phòng',
    'Tính tại server theo ngày bắt đầu, giá toà, số người và xe đăng ký. Không gồm điện nước hay cọc.',
  ],
  'GET /api/buildings/{buildingId}/billing/{period}/preview': [
    'Xem trước lập hoá đơn kỳ',
    '`period` là kỳ hoá đơn M (YYYY-MM): tiền phòng và dịch vụ của M, điện nước tiêu thụ trong M−1. Liệt kê hợp đồng active/ending có ngày ở trong M: đủ điều kiện (tổng dự kiến, gồm cả dòng thêm tay của bản nháp) hoặc bị loại kèm `reason` (`missing_reading`, `missing_meter`, `negative_consumption`, `already_issued`, `move_in_invoice`, `no_occupancy`, `invalid_data`). Không ghi dữ liệu. Ngoài phạm vi trả 404.',
  ],
  'POST /api/buildings/{buildingId}/billing/{period}/drafts': [
    'Tạo/làm mới bản nháp hoá đơn kỳ',
    'Bắt buộc `Idempotency-Key`: gọi lại cùng key trả kết quả cũ (`replayed: true`), không tạo trùng. Làm mới tính lại bản nháp (giữ dòng phụ thu/giảm trừ thêm tay), không bao giờ tính lại hoá đơn đã phát hành. Hợp đồng bị loại không có hoá đơn. Trả bản xem trước sau khi ghi kèm số bản nháp tạo mới/làm mới.',
  ],
  'GET /api/invoices': [
    'Danh sách hoá đơn',
    'Lọc buildingId, period, kind, status, roomId, contractId, overdue=true|false (quá hạn suy ra: issued/partially_paid, quá `dueOn + graceDays` của toà theo Asia/Ho_Chi_Minh, còn nợ; `overdueFrom` là ngày đầu tiên quá hạn). `q` tìm theo mã hoá đơn hoặc mã phòng. Người thuê chỉ thấy hoá đơn đã phát hành của hợp đồng mình.',
  ],
  'GET /api/invoices/{id}': [
    'Chi tiết hoá đơn',
    'Kèm các dòng snapshot (đơn giá, tỷ lệ ngày, chỉ số đầu/cuối, dòng làm tròn); tổng các dòng luôn bằng `total`. `payments`: lịch sử thu (mới nhất trước, gồm cả bút toán đã huỷ). Ngoài phạm vi trả 404.',
  ],
  'POST /api/invoices/{id}/lines': [
    'Thêm phụ thu/giảm trừ',
    'Chỉ bản nháp (409 `invoice_not_draft`). `amount` > 0; giảm trừ lưu âm. `reason` bắt buộc. Dòng làm tròn và tổng được tính lại. `version` tuỳ chọn: lệch trả 409 `version_conflict`.',
  ],
  'DELETE /api/invoices/{id}/lines/{lineId}': [
    'Xoá dòng thêm tay',
    'Chỉ bản nháp và dòng `manual` (409 `invoice_line_not_manual`). Dòng làm tròn và tổng được tính lại.',
  ],
  'POST /api/invoices/issue': [
    'Phát hành hoá đơn',
    'Gửi `ids` (1–400 bản nháp). Trong một transaction: khoá phòng, cấp mã `{mã toà}-{YYYYMM}-{nnn}` từ `invoice_sequences` (khoá dòng, không trùng khi phát hành song song; nhận phòng/thanh lý dùng kỳ của ngày phát hành), đặt `issuedOn`/`dueOn` theo kỳ thu của toà/hệ thống, khoá chỉ số đã dùng. 409 `invoice_not_draft`, `invoice_readings_changed` (chỉ số đổi sau khi tạo nháp: làm mới trước), `invoice_sequence_exhausted`.',
  ],
  'POST /api/invoices/{id}/void': [
    'Void hoá đơn',
    'Chỉ chủ trọ. Bản nháp hoặc hoá đơn đã phát hành chưa có thanh toán (`paidTotal = 0`, ngược lại 409 `invoice_has_payments`; huỷ hết bút toán thu thì void được); `reason` bắt buộc. Mở khoá chỉ số không còn hoá đơn phát hành nào dùng; kỳ được lập lại bản nháp mới.',
  ],
  'POST /api/contracts/{id}/move-in-invoice': [
    'Tạo hoá đơn nhận phòng',
    'Cho hợp đồng active/ending chưa có hoá đơn nhận phòng (409 `move_in_invoice_exists`) và chưa có hoá đơn kỳ của tháng bắt đầu (409 `period_already_invoiced`). Tạo bản nháp từ cùng cách tính với move-in-preview.',
  ],
  'POST /api/invoices/{id}/share': [
    'Tạo/làm mới link chia sẻ hoá đơn',
    'Chỉ hoá đơn đã phát hành (`issued`, `partially_paid`, `paid`); nháp/void trả 409 `invoice_not_shareable`. Tạo token ngẫu nhiên (32 byte, base64url) hạn 60 ngày; chỉ lưu SHA-256 của token. Token và `url` (`/i/{token}` trên web) chỉ trả về một lần; gọi lại tạo token mới và link cũ hết hiệu lực. Quyền `update:Invoice` (người quản lý trong toà được gán). Audit không chứa token. Ngoài phạm vi trả 404.',
  ],
  'DELETE /api/invoices/{id}/share': [
    'Thu hồi link chia sẻ hoá đơn',
    'Xoá hash và hạn của link: trang công khai trả 404. Gọi lại khi không còn link trả `revoked: false`. Ngoài phạm vi trả 404.',
  ],
  'POST /api/buildings/{buildingId}/billing/{period}/shares': [
    'Chia sẻ hàng loạt hoá đơn của kỳ',
    'Bắt buộc `Idempotency-Key`. Tạo/làm mới link cho mọi hoá đơn đã phát hành (gồm thu một phần/đã thu) của toà và kỳ, trả `{ invoiceId, roomCode, code, total, remaining, url }` theo mã phòng. Gọi lại cùng key trả lại đúng các link đó (`replayed: true`, bỏ các link đã bị làm mới/thu hồi sau đó); key mới làm mới tất cả và link cũ hết hiệu lực. Ngoài phạm vi trả 404.',
  ],
  'GET /api/public/invoices/{token}': [
    'Hoá đơn công khai qua link chia sẻ',
    'Không cần đăng nhập, giới hạn 60 yêu cầu/phút mỗi IP. Token không tồn tại, hết hạn, đã thu hồi/làm mới, hoặc hoá đơn void → 404. Dữ liệu tối giản: toà (tên, địa chỉ), phòng, kỳ, loại, mã, trạng thái, ngày phát hành/hạn, các dòng (mô tả i18n, số tiền, chỉ số), tổng, đã thu, còn lại, tên người đại diện viết tắt, tài khoản nhận tiền và `vietQrPayload` (VietQR NAPAS cho số còn lại, nội dung theo mẫu hệ thống với mã hoá đơn; `null` khi đã thu đủ hoặc toà chưa có tài khoản). Không có SĐT, CCCD, ghi chú hay id nội bộ.',
  ],
  'GET /api/contracts/{id}/portal-links': [
    'Link cổng người thuê của hợp đồng',
    'Mọi link của hợp đồng (mới nhất trước): người ở, trạng thái `active`/`locked`/`revoked`/`expired`, lần xác minh gần nhất, số thiết bị đang đăng nhập. Không bao giờ trả token hay hash. Ngoài phạm vi trả 404.',
  ],
  'POST /api/contracts/{id}/portal-links': [
    'Tạo link cổng cho một người ở',
    'Hợp đồng active/ending (409 `contract_not_active`), `tenantId` là người ở hiện tại (422 `portal_tenant_not_occupant`). Token ngẫu nhiên 32 byte (base64url), chỉ lưu SHA-256; `token`, `path` (`/p/{token}`) và `url` chỉ trả một lần. Link đang hoạt động của cùng người ở bị thu hồi và các thiết bị của nó bị đăng xuất (`replacedLinkId`). Quyền `update:Contract`; audit chỉ ghi id. Ngoài phạm vi trả 404.',
  ],
  'DELETE /api/portal-links/{id}': [
    'Thu hồi link cổng người thuê',
    'Idempotent (`revoked: false` khi đã thu hồi). Xoá mọi phiên cổng của link: mọi thiết bị đã vào bị đăng xuất. Quyền `update:Contract`; link ngoài phạm vi trả 404.',
  ],
  'POST /api/portal/links/lookup': [
    'Xem link cổng trước khi xác minh',
    'Công khai, giới hạn theo IP. Trả phòng, tên toà và `signedIn` (thiết bị đã có phiên cổng của link này). Link không đúng, đã thu hồi, hết hạn (hợp đồng kết thúc quá 30 ngày, đã huỷ hoặc người ở đã rời) → 404 `portal_link_invalid`, không phân biệt lý do. Không ghi dữ liệu.',
  ],
  'POST /api/portal/sessions': [
    'Vào cổng người thuê (4 số cuối SĐT)',
    'Công khai; giới hạn theo IP và theo token. So sánh 4 số cuối SĐT của chính người ở (constant-time). Link sai/thu hồi/hết hạn và sai số đều trả cùng 401 `portal_verification_failed`. Sai 5 lần liên tiếp → khoá link 15 phút (429 `portal_link_locked`, `Retry-After`, `extensions.retryAfterSeconds`). Thành công: đặt cookie HttpOnly `stay_portal_session` (SameSite=Lax, path `/api/portal`, Secure ở production, 90 ngày), chỉ lưu SHA-256 của giá trị cookie; ghi lần mở gần nhất.',
  ],
  'DELETE /api/portal/sessions': [
    'Đăng xuất cổng người thuê',
    'Xoá phiên cổng của thiết bị này và xoá cookie. Không có phiên hợp lệ → 401 `portal_session_invalid`. Ghi qua cookie cần origin web được phép.',
  ],
  'GET /api/portal/me': [
    'Trang chủ người thuê',
    'Tên của chính người ở, phòng, toà, SĐT liên hệ, hoá đơn gần nhất đã phát hành, tổng nợ, nợ các hoá đơn khác và thông báo ghim còn hạn của toà/phòng.',
  ],
  'GET /api/portal/invoices': [
    'Hoá đơn của tôi',
    'Hoá đơn đã phát hành (gồm thu một phần/đã thu) của hợp đồng, mới nhất trước. Không có nháp hay void.',
  ],
  'GET /api/portal/invoices/{id}': [
    'Chi tiết hoá đơn và thanh toán',
    'Như hoá đơn công khai (dòng, tổng, tài khoản nhận tiền, `vietQrPayload` cho số còn lại) kèm `id` và lịch sử thanh toán chưa huỷ (không có mã giao dịch, ghi chú hay người thu). Hoá đơn của hợp đồng khác, nháp hoặc void → 404.',
  ],
  'GET /api/portal/contract': [
    'Hợp đồng của tôi (chỉ xem)',
    'Phòng, thời hạn, giá thuê hiện tại, dịch vụ và đơn giá đang áp dụng, người ở cùng (chỉ tên viết tắt), xe (biển số xe người khác bị che), cọc đang giữ, ngày phát hành/hạn thanh toán hằng tháng.',
  ],
  'GET /api/portal/usage': [
    'Điện nước của tôi',
    'Tối đa 12 tháng tiêu thụ gần nhất (cũ trước) từ dòng điện/nước của hoá đơn đã phát hành: chỉ số đầu/cuối, tiêu thụ, đơn giá, thành tiền.',
  ],
  'GET /api/portal/notices': [
    'Thông báo và nội quy',
    'Thông báo còn hạn của toà (cả toà hoặc phòng của hợp đồng), ghim trước rồi mới nhất; nội quy và SĐT liên hệ của toà.',
  ],
  'POST /api/portal/invoices/{id}/payment-claims': [
    'Tôi đã chuyển khoản',
    'Người thuê báo đã chuyển khoản cho hoá đơn đã phát hành của hợp đồng mình: `amount` 1 … số còn lại (vượt trả 422 `payment_exceeds_remaining`, `extensions.remaining`), `paidOn` không sau hôm nay, `receiptFileId` là ảnh `payment_receipt` tải lên qua `POST /api/portal/uploads` của chính link. Mỗi hoá đơn chỉ một báo chuyển khoản đang chờ (409 `payment_claim_pending`); đã thu đủ 409 `invoice_already_paid`. `Idempotency-Key` (tuỳ chọn): gửi lại cùng key và nội dung trả lại cùng báo chuyển khoản, khác nội dung 409 `idempotency_conflict`. Không ghi sổ thu: chủ trọ xác nhận ở `POST /api/payment-claims/{id}/confirm`. Hoá đơn của hợp đồng khác → 404.',
  ],
  'POST /api/portal/payment-claims/{id}/cancel': [
    'Huỷ báo chuyển khoản',
    'Chỉ người gửi, khi còn `pending` (409 `request_not_pending`). Của hợp đồng/người khác → 404.',
  ],
  'GET /api/portal/maintenance': [
    'Báo hỏng của phòng',
    'Báo hỏng của hợp đồng (mới nhất trước, tối đa 100): trạng thái, trả lời của chủ trọ, ảnh (URL ký ngắn hạn), `isOwn`.',
  ],
  'POST /api/portal/maintenance': [
    'Gửi báo hỏng',
    'Hạng mục `electricity`/`water`/`appliance`/`other`, mức độ `normal`/`urgent`, tiêu đề, mô tả, tối đa 5 ảnh `maintenance_photo` của chính link. Hợp đồng phải active/ending (409 `contract_not_active`). Giới hạn 10 báo hỏng/ngày/hợp đồng (429 `rate_limit_exceeded`).',
  ],
  'POST /api/portal/maintenance/{id}/cancel': [
    'Huỷ báo hỏng',
    'Chỉ người gửi, khi chủ trọ chưa nhận xử lý (`new`, 409 `request_not_pending`). Của hợp đồng/người khác → 404.',
  ],
  'GET /api/portal/requests': [
    'Yêu cầu của tôi',
    'Yêu cầu do chính người ở này gửi (mới nhất trước, tối đa 100): loại, nội dung, trạng thái `new`/`accepted`/`rejected`/`cancelled`, trả lời hoặc lý do từ chối.',
  ],
  'POST /api/portal/requests': [
    'Gửi yêu cầu cho chủ trọ',
    '`type` và `payload` theo loại: `move_out` `{ expectedMoveOutDate ≥ hôm nay, reason? }`, `add_occupant` `{ fullName, phone (10 số, bắt đầu 0), fromDate }`, `remove_occupant` `{ fullName, toDate }`, `add_vehicle` `{ plate, vehicleType, fromDate }`, `remove_vehicle` `{ plate, toDate }`, `other` `{ message }`. Ngày phải trong thời hạn hợp đồng; lỗi field trả dạng `payload.<field>`. Hợp đồng active/ending (409 `contract_not_active`). Chỉ là đề nghị: hợp đồng chỉ đổi khi chủ trọ duyệt. Giới hạn 10 yêu cầu/ngày/hợp đồng.',
  ],
  'POST /api/portal/requests/{id}/cancel': [
    'Huỷ yêu cầu',
    'Chỉ yêu cầu của chính mình còn `new` (409 `request_not_pending`). Của hợp đồng/người khác → 404.',
  ],
  'POST /api/portal/uploads': [
    'Xin ticket tải ảnh (cổng người thuê)',
    '`purpose` `payment_receipt` (biên lai) hoặc `maintenance_photo` (ảnh báo hỏng). Ticket 10 phút, thuộc link cổng (không phải tài khoản nhân viên), ảnh JPG/PNG/WEBP ≤ 10 MB gửi thẳng tới `uploadUrl`. Giới hạn 60 ticket/ngày/hợp đồng.',
  ],
  'POST /api/portal/uploads/{id}/complete': [
    'Hoàn tất tải ảnh (cổng người thuê)',
    'Kiểm tra ảnh đã lưu và trả `fileId` để gắn vào báo chuyển khoản/báo hỏng. Ticket của link khác → 404.',
  ],
  'GET /api/requests': [
    'Hộp yêu cầu từ người thuê',
    'Báo hỏng (nguồn người thuê), yêu cầu và báo chuyển khoản trong một danh sách, mới nhất trước. Lọc `kind` (`maintenance`, `tenant_request`, `payment_claim`), `status` chung (`pending`, `in_progress`, `done`, `rejected`, `cancelled`), `buildingId`, `contractId` (tab Yêu cầu của hợp đồng), `q` (mã phòng, mã hợp đồng, tên người gửi, tiêu đề, mã hoá đơn). `meta.counts` đếm mọi trạng thái (kể cả 0) theo bộ lọc trừ `status`. Báo hỏng/yêu cầu cần quyền `read:Maintenance`, báo chuyển khoản `read:Payment` theo toà; toà/hợp đồng ngoài phạm vi trả 404. Ảnh trả URL ký ngắn hạn.',
  ],
  'POST /api/requests/{id}/accept': [
    'Duyệt yêu cầu / nhận xử lý báo hỏng',
    'Báo hỏng: `new`/`open`/`in_progress` → `in_progress` (hoặc `done` khi `done: true`). Yêu cầu (`new`): chạy đúng thao tác hợp đồng trong cùng transaction — `move_out` → báo trả phòng ST-17 (hợp đồng `ending`), `add_occupant` → thêm người ở ST-12 từ ngày hiệu lực, `remove_occupant` → người ở rời đi (`tenantId` chọn người ở nếu tên không khớp đúng một người; `newPrimaryTenantId` khi người đại diện rời đi), `add_vehicle` → tạo xe của người gửi (nếu chưa có) và đăng ký tính phí, `remove_vehicle` → bớt xe (`vehicleId` nếu biển số không khớp), `other` → chỉ đánh dấu đã duyệt. `effectiveDate` ghi đè ngày trong yêu cầu. Lỗi kiểm tra của ST-12/ST-17 (422/409) huỷ toàn bộ, yêu cầu vẫn `new`. Đã xử lý → 409 `request_not_pending`. Quyền `update:Maintenance` theo toà và `update:Contract`.',
  ],
  'POST /api/requests/{id}/reject': [
    'Từ chối yêu cầu / báo hỏng',
    '`reason` bắt buộc; người thuê thấy lý do. Chỉ khi chưa đóng (409 `request_not_pending`). Audit không ghi lý do.',
  ],
  'POST /api/requests/{id}/reply': [
    'Trả lời người thuê',
    'Ghi đè trả lời gần nhất (người thuê thấy ở T-08/T-09), không đổi trạng thái. Yêu cầu đã huỷ → 409 `request_not_pending`.',
  ],
  'POST /api/payment-claims/{id}/confirm': [
    'Xác nhận chuyển khoản',
    'Tạo khoản thu ST-15 (`bank_transfer`, mã giao dịch từ báo chuyển khoản) cho hoá đơn và đánh dấu `confirmed` trong cùng transaction; khoá báo chuyển khoản trước nên bấm lại/gọi đồng thời trả cùng khoản thu, không ghi hai lần. Có thể sửa `amount`, `paidOn`, `reference` khi xác nhận (số tiền vượt số còn lại → 422 `payment_exceeds_remaining`). Đã từ chối/huỷ → 409 `request_not_pending`. Quyền `create:Payment` theo toà.',
  ],
  'POST /api/payment-claims/{id}/reject': [
    'Từ chối báo chuyển khoản',
    '`reason` bắt buộc (người thuê thấy lý do); hoá đơn không đổi. Chỉ khi `pending`.',
  ],
  'GET /api/announcements': [
    'Thông báo cho người thuê',
    'Lọc `buildingId`, `status` (`active` còn hiển thị, `expired` đã hết hạn/lưu trữ, `all` mặc định), `q` (tiêu đề, nội dung). Ghim trước rồi mới nhất. Quyền `update:Building` theo toà (chủ trọ, người quản lý toà); ngoài phạm vi trả 404.',
  ],
  'POST /api/announcements': [
    'Tạo thông báo',
    '`roomIds` rỗng/null = cả toà, ngược lại các phòng đang hoạt động của toà (422 `roomIds`). `expiresOn` là ngày cuối còn hiển thị (Asia/Ho_Chi_Minh), không trước hôm nay; null = không hết hạn. Audit chỉ ghi id, số phòng, ghim, hạn.',
  ],
  'PUT /api/announcements/{id}': [
    'Sửa thông báo',
    `Gửi đủ trường như khi tạo và \`version\`; không đổi toà. ${VERSION_NOTE}`,
  ],
  'POST /api/announcements/{id}/archive': [
    'Lưu trữ thông báo',
    'Ẩn với người thuê ngay (hết hạn từ bây giờ, bỏ ghim). Gọi lại không đổi gì.',
  ],
  'DELETE /api/announcements/{id}': ['Xoá thông báo', 'Xoá hẳn. Ngoài phạm vi trả 404.'],
  'POST /api/invoices/{id}/payments': [
    'Thu tiền hoá đơn',
    'Bắt buộc `Idempotency-Key`: gọi lại cùng key và nội dung trả lại đúng khoản đã ghi, không ghi hai lần (khác nội dung trả 409 `idempotency_conflict`). Khoá dòng hoá đơn nên hai khoản thu song song không vượt tổng. Chỉ hoá đơn đã phát hành chưa thu đủ: nháp 409 `invoice_not_issued`, void 409 `invoice_void`, đã thu đủ 409 `invoice_already_paid`. `amount` > 0 và ≤ số còn lại (vượt trả 422 `payment_exceeds_remaining`, `extensions.remaining`; không tự ghi thừa). `paidOn` không sau hôm nay (Asia/Ho_Chi_Minh). Cập nhật `paidTotal` và trạng thái (`issued` → `partially_paid` → `paid`) trong cùng transaction. Ngoài phạm vi trả 404.',
  ],
  'POST /api/payments/{id}/reverse': [
    'Huỷ bút toán thu',
    'Thanh toán không sửa/xoá: ghi `reversedAt`, `reverseReason` (bắt buộc), người huỷ. Mỗi khoản chỉ huỷ một lần (409 `payment_already_reversed`). `paidTotal` và trạng thái hoá đơn tính lại từ các khoản còn lại. Quyền `void:Payment` (mặc định chỉ chủ trọ). Ngoài phạm vi trả 404.',
  ],
  'GET /api/payments': [
    'Sổ thu',
    'Lọc `buildingId`, `dateFrom`/`dateTo` (ngày thu, gồm cả hai đầu), `method`, `invoiceId`; `q` tìm theo mã hoá đơn, mã phòng hoặc mã giao dịch. Khoản đã huỷ chỉ hiện khi `includeReversed=true`. `meta.totals` (theo phương thức) và `meta.totalAmount` tính trên toàn bộ bộ lọc trước phân trang và không gồm khoản đã huỷ. Người quản lý chỉ thấy toà được gán; `buildingId` ngoài phạm vi trả 404.',
  ],
  'GET /api/buildings/{buildingId}/receivables': [
    'Công nợ của toà',
    'Mỗi dòng là một hợp đồng có hoá đơn chưa thu đủ (`issued`/`partially_paid`, `total − paidTotal > 0`; nháp và void không tính): mã hợp đồng, phòng hiện tại, người đại diện (`representativePhone` chỉ khi được xem người thuê của toà), số hoá đơn, tổng còn lại, phần quá hạn, hạn cũ nhất, số ngày quá hạn lâu nhất (hôm nay theo Asia/Ho_Chi_Minh so với `dueOn + graceDays` của toà) và nhóm `bucket` (`not_due`, `1_7`, `8_30`, `over_30`), kèm các hoá đơn đó (hạn cũ nhất trước, có `shareExpiresAt`). `q` tìm theo mã phòng, mã hợp đồng, tên hoặc SĐT người ở; lọc `bucket`; `sortBy` `remaining` (mặc định, giảm dần), `overdueDays`, `roomCode`. `meta.totalRemaining`, `meta.overdueRemaining`, `meta.invoiceCount` tính trên toàn bộ bộ lọc trước phân trang và luôn bằng tổng `total − paidTotal` của các hoá đơn được tính; `meta.buckets` đếm theo `q` nhưng không theo `bucket` (cho các chip). Toà ngoài phạm vi trả 404.',
  ],
  'GET /api/buildings/{buildingId}/overview': [
    'Tổng quan tháng của toà',
    'Kỳ `period` = M (`YYYY-MM`, năm 2000–2099; ngoài khoảng trả 422 `period_out_of_range`), mặc định kỳ hiện tại: kỳ mới nhất có ngày phát hành (`issueDay` của toà, hoặc mặc định hệ thống) ≤ hôm nay theo Asia/Ho_Chi_Minh. `current`/`previous`/`series` (6 kỳ, cũ trước): `billed` = tổng `total` của hoá đơn kỳ đó đã phát hành (`issued`, `partially_paid`, `paid`; mọi loại `monthly`, `move_in`, `settlement`; nháp và void không tính), `collected` = các khoản thu chưa huỷ của chính các hoá đơn đó (bất kể ngày thu), `remaining` = `billed − collected`. `collectedInMonth` = tiền thu theo ngày `paidOn` trong tháng M (bằng `meta.totalAmount` của sổ thu cùng khoảng ngày). `receivables` bằng tổng của màn Công nợ (cùng truy vấn). `rooms` = phòng chưa lưu trữ theo trạng thái hôm nay; `occupancy` tính tại ngày cuối kỳ (hoặc hôm nay nếu kỳ chưa hết), `rate` = đang thuê / tổng phòng. `todos` luôn đủ 7 mục theo lịch tháng (kể cả 0): `readings` (phòng còn thiếu chỉ số điện hoặc nước tháng M−1, `total` = số phòng cần chốt), `invoices_to_create` (hợp đồng tính tiền được trong M chưa có hoá đơn kỳ/nhận phòng không void), `draft_invoices`, `unshared_invoices` (đã phát hành, còn nợ, không có link còn hạn), `overdue_invoices` (`amount` = tiền quá hạn; mở nhóm quá hạn nặng nhất), `expiring_contracts` (hết hạn trong 30 ngày), `ending_contracts` (đã báo trả phòng). Mỗi mục có `link` `{ path, query }` tới màn xử lý. Toà ngoài phạm vi trả 404.',
  ],
  'GET /api/audit-logs': [
    'Lịch sử thay đổi',
    'Người quản lý chỉ xem các toà được gán. from/to gồm cả ngày kết thúc.',
  ],
  'GET /api/audit-logs/{id}': [
    'Chi tiết thay đổi',
    'Ngoài phạm vi trả 404; nội dung được redact khi đọc.',
  ],
  'GET /api/me': ['Người dùng hiện tại', 'Gồm vai trò và các toà được gán (người quản lý).'],
  'GET /api/me/capabilities': [
    'Quyền của người dùng hiện tại',
    'Rule CASL dùng với `stayAbilityKit` của `@stay/shared`; `contractVersion` đổi khi hợp đồng API thay đổi.',
  ],
  'GET /health/live': ['Liveness'],
  'GET /health': [
    'Health check',
    'Kiểm tra kết nối database; trả 503 khi database không sẵn sàng.',
  ],
  'GET /api/settings': [
    'Kỳ thu mặc định',
    'Ngày chốt số và tháng chốt số (`readingDayMonth`), ngày phát hành, hạn thanh toán, số ngày ân hạn trước khi tính quá hạn (`graceDays`), đơn vị làm tròn, hoàn tiền phòng và mẫu nội dung chuyển khoản. Toà để trống trường nào thì theo giá trị ở đây.',
  ],
  'PUT /api/settings': [
    'Cập nhật kỳ thu mặc định',
    `${BILLING_DAY_NOTE} Làm tròn 1, 100 hoặc 1.000đ. ${VERSION_NOTE}`,
  ],
  'GET /api/services': [
    'Danh mục dịch vụ',
    'Mọi dịch vụ (cả đã tắt, xem `active`), theo `sortOrder`.',
  ],
  'POST /api/services': [
    'Thêm dịch vụ',
    'Tên không trùng (không phân biệt hoa thường); `description` tuỳ chọn, tối đa 500 ký tự, được chụp vào dòng hoá đơn (`meta.serviceDescription`) khi lập bản nháp; đơn giá số nguyên VND ≥ 0. Chỉ một dịch vụ `electricity` và một `water` đang bật. `code` sinh từ tên; `kind` không đổi được sau khi tạo.',
  ],
  'PUT /api/services/{id}': [
    'Sửa dịch vụ',
    `Sửa tên, mô tả (\`description\`), đơn vị, đơn giá mặc định, thứ tự, bật/tắt. Hoá đơn đã phát hành giữ mô tả đã chụp. Không xoá dịch vụ: chỉ tắt. Đổi giá không ảnh hưởng hoá đơn đã phát hành. ${VERSION_NOTE}`,
  ],
  'GET /api/buildings': [
    'Danh sách toà',
    'Chỉ các toà người dùng được xem (người quản lý: toà được gán). Mặc định ẩn toà đã lưu trữ (`status=active`).',
  ],
  'POST /api/buildings': [
    'Tạo toà',
    `Mã A–Z, 0–9, tối đa 6 ký tự, duy nhất. Kỳ thu, làm tròn, hoàn tiền phòng để \`null\` = theo hệ thống. ${BILLING_DAY_NOTE} Tài khoản ngân hàng nhập đủ cả ba trường (BIN VietQR 6 số, số tài khoản, tên chủ tài khoản in hoa không dấu) hoặc bỏ trống.`,
  ],
  'GET /api/buildings/{id}': [
    'Chi tiết toà',
    'Kèm thống kê nhanh, kỳ thu đang áp dụng (`billing`) và `codeLocked`. Toà ngoài phạm vi của người dùng trả 404.',
  ],
  'PUT /api/buildings/{id}': [
    'Sửa toà',
    `Gửi đủ các trường như khi tạo (trường bỏ trống = \`null\`). Không đổi được mã khi toà đã có hoá đơn (\`codeLocked\`). Toà đã lưu trữ trả 409. ${VERSION_NOTE}`,
  ],
  'POST /api/buildings/{id}/archive': [
    'Lưu trữ toà',
    'Trả 409 `building_has_active_contracts` kèm `extensions.rooms` khi còn phòng có hợp đồng hiệu lực.',
  ],
  'GET /api/buildings/{id}/prices': [
    'Đơn giá của toà',
    'Giá từng dịch vụ tại ngày `date` (`YYYY-MM-DD`, mặc định hôm nay theo Asia/Ho_Chi_Minh): bản ghi ghi đè có `effectiveFrom` lớn nhất ≤ ngày đó, không có thì giá mặc định. Kèm lịch sử ghi đè.',
  ],
  'PUT /api/buildings/{id}/prices': [
    'Đặt giá riêng từ một ngày',
    '`price: null` = quay về giá mặc định từ `effectiveFrom`. Đã có bản ghi cùng ngày thì thay thế, trừ khi hoá đơn đã phát hành dùng giá đó (409 `price_history_locked`).',
  ],
  'GET /api/buildings/{buildingId}/rooms': [
    'Danh sách phòng của toà (sơ đồ phòng)',
    'Phòng chưa lưu trữ, mặc định theo tầng rồi mã. Lọc `floor`, `status` (trạng thái suy ra: `vacant`, `reserved`, `occupied`, `maintenance`), tìm `q` theo mã phòng. Kèm hợp đồng hiện tại, số người ở, công nợ (rỗng/0 cho tới khi có hợp đồng và hoá đơn). Toà ngoài phạm vi trả 404.',
  ],
  'GET /api/buildings/{buildingId}/rooms/summary': [
    'Tổng số phòng theo trạng thái',
    'Đếm phòng chưa lưu trữ theo trạng thái suy ra và danh sách tầng, dùng cho đầu sơ đồ phòng và bộ lọc tầng.',
  ],
  'POST /api/buildings/{buildingId}/rooms': [
    'Tạo phòng',
    `Mã A–Z, 0–9, \`.\`, \`-\` (tối đa 12, tự viết hoa), duy nhất trong các phòng chưa lưu trữ của toà. Tạo kèm một đồng hồ điện và một đồng hồ nước với chỉ số ban đầu là số nguyên ≥ 0 (mặc định 0). Toà đã lưu trữ trả 409.`,
  ],
  'POST /api/buildings/{buildingId}/rooms/bulk/preview': [
    'Xem trước tạo nhanh nhiều phòng',
    'Sinh mã theo mẫu (`{floor}` = số tầng, `{number}` = số phòng 2 chữ số, ví dụ `{floor}{number}` → 101…104) và đánh dấu mã đã có (`exists`, sẽ bỏ qua). Tối đa 200 phòng mỗi lần.',
  ],
  'POST /api/buildings/{buildingId}/rooms/bulk': [
    'Tạo nhanh nhiều phòng',
    'Tạo các mã sinh từ mẫu trong một giao dịch, bỏ qua mã đã có (`skipped`). Giá niêm yết chung, sửa từng phòng qua `prices` (mã phải thuộc danh sách sinh ra). Gọi lại cùng `Idempotency-Key` và cùng nội dung trả lại kết quả lần đầu, không tạo trùng; khác nội dung trả 409 `idempotency_conflict`.',
  ],
  'GET /api/rooms/{id}': [
    'Chi tiết phòng',
    'Thông tin phòng, dịch vụ mặc định, đồng hồ đang dùng (chỉ số ban đầu, chỉ số gần nhất), hợp đồng hiện tại, người ở và 6 hoá đơn gần nhất (rỗng cho tới khi có hợp đồng, chốt số và hoá đơn). Phòng thuộc toà ngoài phạm vi trả 404.',
  ],
  'PUT /api/rooms/{id}': [
    'Sửa phòng',
    `Gửi đủ các trường như khi tạo (trừ chỉ số/seri đồng hồ: thay đồng hồ ở ST-13). Không sửa tay trạng thái thuê. Phòng đã lưu trữ trả 409 \`room_archived\`. ${VERSION_NOTE}`,
  ],
  'POST /api/rooms/{id}/maintenance': [
    'Bật/tắt bảo trì phòng',
    `Bật cần \`reason\`, \`until\` (tuỳ chọn) không trước hôm nay. Phòng đang có hợp đồng hiệu lực trả 409 \`room_has_contract\`. ${VERSION_NOTE}`,
  ],
  'POST /api/rooms/{id}/archive': [
    'Lưu trữ phòng',
    'Ẩn phòng khỏi sơ đồ và giải phóng mã phòng. Phòng đang có hợp đồng hiệu lực trả 409 `room_has_contract`.',
  ],
  'GET /api/tenants': [
    'Danh sách người thuê',
    'Người quản lý chỉ thấy người thuê của toà được gán. `q` tìm theo tên, SĐT; 4 chữ số cũng khớp 4 số cuối CCCD. `status`: `all` (mặc định, ẩn hồ sơ đã lưu trữ), `living` (đang ở), `left` (đã rời), `no_contract` (chưa có hợp đồng), `archived`. Trạng thái suy ra từ hợp đồng (ST-10). CCCD luôn che giữa.',
  ],
  'POST /api/tenants': ['Tạo người thuê', `Gửi \`buildingId\` của toà. ${TENANT_FIELDS_NOTE}`],
  'GET /api/tenants/{id}': [
    'Hồ sơ người thuê',
    'Kèm xe, ảnh CCCD (`url` ký, hết hạn sau 5 phút: đọc lại hồ sơ để lấy URL mới), hợp đồng đã/đang ở. CCCD che giữa; xem đủ qua `reveal-id`. Người thuê ngoài phạm vi trả 404.',
  ],
  'PUT /api/tenants/{id}': [
    'Sửa người thuê',
    `Gửi đủ các trường như khi tạo (bỏ trống = \`null\`), trừ \`idNumber\`: không gửi thì giữ CCCD đang lưu, \`null\` để xoá. ${TENANT_FIELDS_NOTE} ${VERSION_NOTE}`,
  ],
  'POST /api/tenants/{id}/reveal-id': [
    'Xem đủ số CCCD',
    'Mỗi lần gọi ghi một dòng audit `tenant.reveal_id_number` (không chứa số CCCD).',
  ],
  'POST /api/tenants/{id}/archive': [
    'Lưu trữ người thuê',
    'Hồ sơ đã lưu trữ không sửa được (409 `tenant_archived`). 409 `tenant_has_active_contract` khi còn ở trong hợp đồng hiệu lực.',
  ],
  'POST /api/tenants/{id}/documents': [
    'Gắn ảnh CCCD',
    '`fileId` từ `POST /api/uploads/{id}/complete` (mục đích `tenant_document`, cùng toà, do chính người dùng tải lên). Mặt trước/sau mới thay ảnh cũ.',
  ],
  'POST /api/tenants/{id}/vehicles': [
    'Thêm xe',
    'Biển số viết hoa; không trùng (bỏ qua dấu gạch, chấm, khoảng trắng) trong các xe của người thuê.',
  ],
  'PUT /api/tenants/{id}/vehicles/{vehicleId}': ['Sửa xe'],
  'DELETE /api/tenants/{id}/vehicles/{vehicleId}': ['Xoá xe'],
  'GET /api/tenants/import/template': [
    'File mẫu import người thuê',
    '`format=xlsx` (mặc định, các cột định dạng văn bản để giữ số 0 đầu) hoặc `csv` (UTF-8). Chỉ có dòng tiêu đề.',
  ],
  'POST /api/tenants/import/preview': [
    'Xem trước file import',
    'Gửi `file` (CSV UTF-8 hoặc XLSX, tối đa 2 MB, 1.000 dòng) và `?buildingId=`. Trả trạng thái từng dòng: `valid`, `error` (lỗi theo cột) hoặc `duplicate` (SĐT đã có trong toà hoặc CCCD đã có, hoặc lặp dòng trước trong file). Không ghi DB, không tự gán phòng.',
  ],
  'POST /api/tenants/import': [
    'Nhập người thuê từ bản xem trước',
    'Gửi lại `values` của các dòng đã xem trước; máy chủ kiểm tra lại và chỉ tạo dòng hợp lệ trong một transaction. Gọi lại cùng `Idempotency-Key` và cùng nội dung trả kết quả cũ (`replayed: true`), không tạo trùng.',
  ],
  'POST /api/uploads': [
    'Xin ticket tải ảnh private',
    'Cần quyền tạo/sửa người thuê ở `buildingId`. Ticket hết hạn sau 10 phút; ảnh JPG/PNG/WEBP tối đa 10 MB.',
  ],
  'GET /api/uploads/{id}': ['Trạng thái ticket tải ảnh', 'Chỉ người tạo ticket xem được.'],
  'POST /api/uploads/{id}/complete': [
    'Xác nhận đã tải ảnh',
    'Máy chủ kiểm tra ảnh trên kho lưu trữ (định dạng, dung lượng) rồi tạo file private. Gọi lại trả cùng kết quả.',
  ],
  'POST /api/uploads/{id}/stub': [
    'Nhận ảnh (kho stub)',
    'Chỉ khi máy chủ chạy kho stub (dev/test/CI, không cấu hình Cloudinary). URL có chữ ký nằm trong `uploadUrl` của ticket; không dùng cookie.',
  ],
  'GET /api/files/{id}/stub': [
    'Xem ảnh private (kho stub)',
    'Chỉ khi máy chủ chạy kho stub. Cần `expires` và `signature` từ URL ký trong hồ sơ người thuê; thiếu/sai/hết hạn trả 403.',
  ],
};

// Billing days are 1–28 or 31 (end of month); the API reports other values per field.
const billingDay = { type: ['integer', 'null'], minimum: 1, maximum: 31 };
const roundingUnit = { type: 'integer', enum: [1, 100, 1000] };
const buildingFields = {
  readingDay: { schema: billingDay },
  readingDayMonth: { schema: { type: ['string', 'null'], enum: ['same', 'next', null] } },
  graceDays: { schema: { type: ['integer', 'null'], minimum: 0, maximum: 31 } },
  issueDay: { schema: billingDay },
  dueDay: { schema: billingDay },
  roundingUnit: { schema: { type: ['integer', 'null'], enum: [...roundingUnit.enum, null] } },
  refundUnusedRent: { schema: { type: ['boolean', 'null'] } },
  moveOutFee: { schema: { type: ['integer', 'null'], minimum: 0, maximum: 100_000_000 } },
  address: { schema: { type: ['string', 'null'], maxLength: 255 } },
  bankBin: { schema: { type: ['string', 'null'], pattern: '^[0-9]{6}$' } },
  bankAccount: { schema: { type: ['string', 'null'], maxLength: 19 } },
  bankAccountName: { schema: { type: ['string', 'null'], maxLength: 50 } },
  rulesText: { schema: { type: ['string', 'null'], maxLength: 5000 } },
  contactPhone: { schema: { type: ['string', 'null'], maxLength: 20 } },
  code: {
    schema: { type: 'string', minLength: 1, maxLength: 6, pattern: '^[A-Za-z0-9]{1,6}$' },
    required: true,
  },
};

// Optional note under the service name, copied to invoice lines; empty or `null` = none.
const serviceFields = {
  description: { schema: { type: ['string', 'null'], maxLength: 500 } },
};

// Area in m², at most two decimals; `null` when unknown.
const areaM2 = { schema: { type: ['number', 'null'], exclusiveMinimum: 0, maximum: 1000 } };
// Default services suggested for contracts; omitted = none.
const serviceIds = {
  schema: { type: 'array', maxItems: 50, items: { type: 'string', format: 'uuid' } },
};
// Whole meter readings (kWh, m³); omitted = 0.
const reading = { schema: { type: 'integer', minimum: 0, maximum: 999_999_999 } };
const initialReadings = { initialElectric: reading, initialWater: reading };
const roomFields = { areaM2, serviceIds };

const tenantText = (maxLength) => ({ schema: { type: ['string', 'null'], maxLength } });
const tenantFields = {
  fullName: { schema: { type: 'string', minLength: 1, maxLength: 120 }, required: true },
  phone: { schema: { type: 'string', minLength: 10, maxLength: 20 }, required: true },
  email: tenantText(255),
  idNumber: { schema: { type: ['string', 'null'], pattern: '^[0-9 .-]{12,20}$' } },
  idIssuedAt: { schema: { type: ['string', 'null'], format: 'date' } },
  birthDate: { schema: { type: ['string', 'null'], format: 'date' } },
  gender: { schema: { type: ['string', 'null'], enum: ['male', 'female', 'other', null] } },
  hometown: tenantText(255),
  permanentAddress: tenantText(255),
  occupation: tenantText(255),
  note: tenantText(2000),
};
const vehicleFields = {
  plate: { schema: { type: 'string', minLength: 4, maxLength: 20 }, required: true },
  type: {
    schema: { type: 'string', enum: ['motorbike', 'electric_bike', 'bicycle', 'car', 'other'] },
    required: true,
  },
  note: tenantText(255),
};
const expenseFields = {
  buildingId: { schema: { type: 'string', format: 'uuid' }, required: true },
  categoryId: { schema: { type: 'string', format: 'uuid' }, required: true },
  roomId: { schema: { type: ['string', 'null'], format: 'uuid' } },
  receiptFileId: { schema: { type: ['string', 'null'], format: 'uuid' } },
  amount: {
    schema: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
    required: true,
  },
  spentOn: {
    schema: {
      type: 'string',
      description: 'YYYY-MM-DD in Asia/Ho_Chi_Minh, or an ISO instant with explicit timezone.',
    },
    required: true,
  },
  note: tenantText(2000),
};
const categoryFields = {
  name: { schema: { type: 'string', minLength: 1, maxLength: 120 }, required: true },
  active: { schema: { type: 'boolean', default: true } },
};
const contractBody = {
  requestBody: {
    required: true,
    content: { 'application/json': { schema: { ref: 'ContractInput' } } },
  },
};
const readingBody = (name) => ({
  requestBody: { required: true, content: { 'application/json': { schema: { ref: name } } } },
});
const settlementBody = (name) => ({
  requestBody: { required: true, content: { 'application/json': { schema: { ref: name } } } },
});
const OVERRIDES = {
  'GET /api/maintenance/expense-categories': {
    response: { type: 'array', items: { ref: 'StayExpenseCategory' } },
  },
  'GET /api/maintenance': {
    list: true,
    response: { type: 'array', items: { ref: 'StayMaintenance' } },
  },
  'GET /api/maintenance/{id}': { response: { ref: 'StayMaintenance' } },
  'POST /api/maintenance': {
    ...readingBody('MaintenanceInput'),
    response: { ref: 'StayMaintenance' },
  },
  'PUT /api/maintenance/{id}': {
    ...readingBody('MaintenanceUpdateInput'),
    response: { ref: 'StayMaintenance' },
  },
  'POST /api/maintenance/{id}/expense': {
    omit: ['buildingId', 'roomId'],
    fields: Object.fromEntries(
      Object.entries(expenseFields).filter(([key]) => key !== 'buildingId' && key !== 'roomId'),
    ),
    response: { ref: 'StayMaintenance' },
  },
  'GET /api/members': { list: true, response: { type: 'array', items: { ref: 'StayMember' } } },
  'POST /api/members/invitations': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'MemberInvitationInput' } } },
    },
  },
  'PUT /api/members/{id}': {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            allOf: [
              { ref: 'MemberInput' },
              {
                type: 'object',
                required: ['version'],
                properties: { version: { type: 'integer', minimum: 0 } },
              },
            ],
          },
        },
      },
    },
  },
  'GET /api/buildings/{id}/automation': { response: { ref: 'StayAutomationSettings' } },
  'PUT /api/buildings/{id}/automation': {
    response: { ref: 'StayAutomationSettings' },
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'StayAutomationSettings' } } },
    },
  },
  'GET /api/notifications': { response: { ref: 'StayNotifications' } },
  ...Object.fromEntries(
    ['/api/me/notification-settings', '/api/portal/notification-settings'].flatMap((url) => [
      [`GET ${url}`, { response: { ref: 'NotificationSettings' } }],
      [
        `PUT ${url}`,
        {
          response: { ref: 'NotificationSettings' },
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { ref: 'NotificationPreferences' } } },
          },
        },
      ],
    ]),
  ),
  ...Object.fromEntries(
    ['/api/me/push-subscriptions', '/api/portal/push-subscriptions'].flatMap((url) => [
      [
        `POST ${url}`,
        {
          response: { ref: 'PushSubscriptionResult' },
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { ref: 'PushSubscriptionInput' } } },
          },
        },
      ],
      [`DELETE ${url}`, { response: { ref: 'PushSubscriptionResult' } }],
    ]),
  ),
  'GET /api/portal/notifications': { response: { ref: 'PortalNotifications' } },
  'POST /api/contracts/{id}/portal-links': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'TenantPortalLinkInput' } } },
    },
  },
  'POST /api/portal/links/lookup': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'PortalLinkLookupInput' } } },
    },
  },
  'POST /api/portal/sessions': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'PortalSessionInput' } } },
    },
  },
  'POST /api/portal/invoices/{id}/payment-claims': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'PaymentClaimInput' } } },
    },
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: false,
        description: 'Tuỳ chọn; mỗi lần mở form dùng một key, bấm lại dùng lại key.',
        schema: { type: 'string', minLength: 8, maxLength: 128 },
      },
    ],
  },
  'POST /api/portal/maintenance': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'PortalMaintenanceInput' } } },
    },
  },
  'POST /api/portal/requests': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'TenantRequestInput' } } },
    },
  },
  'POST /api/portal/uploads': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'PortalUploadInput' } } },
    },
  },
  'POST /api/requests/{id}/accept': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'InboxAcceptInput' } } },
    },
  },
  'POST /api/requests/{id}/reject': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'InboxRejectInput' } } },
    },
  },
  'POST /api/requests/{id}/reply': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'InboxReplyInput' } } },
    },
  },
  'POST /api/payment-claims/{id}/confirm': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'PaymentClaimConfirmInput' } } },
    },
  },
  'POST /api/payment-claims/{id}/reject': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'InboxRejectInput' } } },
    },
  },
  'POST /api/announcements': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'AnnouncementInput' } } },
    },
  },
  'PUT /api/announcements/{id}': {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            allOf: [
              { ref: 'AnnouncementInput' },
              {
                type: 'object',
                required: ['version'],
                properties: { version: { type: 'integer', minimum: 1 } },
              },
            ],
          },
        },
      },
    },
  },
  'GET /api/buildings/{buildingId}/residents': {
    list: true,
    response: { type: 'array', items: { ref: 'StayResident' } },
    parameters: [
      { name: 'date', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
      { name: 'status', in: 'query', schema: { type: 'string', enum: ['all', 'unregistered'] } },
    ],
  },
  'POST /api/resident-stays/{id}/registration': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'ResidentRegistrationInput' } } },
    },
  },
  'POST /api/buildings/{buildingId}/residents/export': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'ResidentExportInput' } } },
    },
  },
  'GET /api/reports/revenue': {
    response: { ref: 'RevenueReport' },
    parameters: [
      {
        name: 'buildingId',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
      ...['from', 'to'].map((name) => ({
        name,
        in: 'query',
        required: true,
        schema: { type: 'string', pattern: '^[0-9]{4}-(0[1-9]|1[0-2])$' },
      })),
    ],
  },
  'GET /api/reports/rooms': {
    response: { ref: 'RoomsReport' },
    parameters: [
      {
        name: 'buildingId',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
      {
        name: 'year',
        in: 'query',
        required: true,
        schema: { type: 'integer', minimum: 2000, maximum: 2099 },
      },
    ],
  },
  'GET /api/reports/utilities': {
    response: { ref: 'UtilitiesReport' },
    parameters: [
      {
        name: 'buildingId',
        in: 'query',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
      ...['from', 'to'].map((name) => ({
        name,
        in: 'query',
        required: true,
        schema: { type: 'string', pattern: '^[0-9]{4}-(0[1-9]|1[0-2])$' },
      })),
    ],
  },
  'POST /api/reports/exports': {
    response: null,
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'ReportExportInput' } } },
    },
  },
  'POST /api/contracts/{id}/notice': settlementBody('ContractNoticeInput'),
  'POST /api/contracts/{id}/cancel-notice': settlementBody('ContractVersionInput'),
  'POST /api/contracts/{id}/settlement-preview': settlementBody('ContractSettlementInput'),
  'POST /api/contracts/{id}/settle': {
    ...settlementBody('ContractSettleInput'),
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        description:
          'Bắt buộc; mỗi lần xác nhận thanh lý dùng một key, bấm lại dùng lại key (trả kết quả cũ, `replayed: true`).',
        schema: { type: 'string', minLength: 8, maxLength: 128 },
      },
    ],
  },
  'POST /api/contracts/{id}/deposits': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'DepositInput' } } },
    },
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: false,
        schema: { type: 'string', minLength: 8, maxLength: 128 },
      },
    ],
  },
  'POST /api/buildings/{buildingId}/billing/{period}/drafts': {
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        description: 'Bắt buộc; gọi lại cùng key và kỳ trả kết quả cũ, không tạo trùng.',
        schema: { type: 'string', minLength: 8, maxLength: 128 },
      },
    ],
  },
  'POST /api/invoices/{id}/lines': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'InvoiceLineInput' } } },
    },
  },
  'POST /api/invoices/issue': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'InvoiceIssueInput' } } },
    },
  },
  'POST /api/invoices/{id}/void': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'InvoiceVoidInput' } } },
    },
  },
  'POST /api/buildings/{buildingId}/billing/{period}/shares': {
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        description: 'Bắt buộc; gọi lại cùng key trả lại cùng các link, không làm mới lần nữa.',
        schema: { type: 'string', minLength: 8, maxLength: 128 },
      },
    ],
  },
  'POST /api/invoices/{id}/payments': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'PaymentInput' } } },
    },
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        description:
          'Bắt buộc; mỗi lần mở hộp thoại Thu tiền dùng một key mới, bấm lại dùng lại key.',
        schema: { type: 'string', minLength: 8, maxLength: 128 },
      },
    ],
  },
  'POST /api/payments/{id}/reverse': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'PaymentReverseInput' } } },
    },
  },
  'GET /api/buildings/{buildingId}/overview': {
    parameters: [
      {
        name: 'period',
        in: 'query',
        required: false,
        description: 'Kỳ M; bỏ trống = kỳ hiện tại theo ngày phát hành của toà.',
        schema: { type: 'string', pattern: '^[0-9]{4}-(0[1-9]|1[0-2])$' },
      },
    ],
  },
  'GET /api/buildings/{buildingId}/readings': {
    parameters: [
      {
        name: 'period',
        in: 'query',
        required: true,
        schema: { type: 'string', pattern: '^[0-9]{4}-(0[1-9]|1[0-2])$' },
      },
    ],
  },
  'PUT /api/buildings/{buildingId}/readings': {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['rows'],
            properties: {
              rows: {
                type: 'array',
                minItems: 1,
                maxItems: 400,
                items: { ref: 'MeterReadingInput' },
              },
            },
          },
        },
      },
    },
  },
  'PUT /api/readings/{id}': readingBody('MeterReadingInput'),
  'POST /api/meters/{id}/replace': {
    ...readingBody('MeterReplacementInput'),
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: false,
        schema: { type: 'string', minLength: 8, maxLength: 128 },
      },
    ],
  },
  'POST /api/expenses': { fields: expenseFields },
  'PUT /api/expenses/{id}': {
    fields: {
      ...expenseFields,
      version: { schema: { type: 'integer', minimum: 1 }, required: true },
    },
  },
  'POST /api/expense-categories': { fields: categoryFields },
  'PUT /api/expense-categories/{id}': {
    fields: {
      ...categoryFields,
      version: { schema: { type: 'integer', minimum: 1 }, required: true },
    },
  },
  'POST /api/contracts': {
    ...contractBody,
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: false,
        description:
          'Tuỳ chọn; retry cùng key và nội dung trả lại cùng bản nháp. Khác nội dung trả 409.',
        schema: { type: 'string', minLength: 8, maxLength: 128 },
      },
    ],
  },
  'PUT /api/contracts/{id}': {
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            allOf: [
              { ref: 'ContractInput' },
              {
                type: 'object',
                required: ['version'],
                properties: { version: { type: 'integer', minimum: 1 } },
              },
            ],
          },
        },
      },
    },
  },
  'PUT /api/settings': {
    fields: {
      roundingUnit: { schema: roundingUnit, required: true },
      readingDayMonth: { schema: { type: 'string', enum: ['same', 'next'], default: 'same' } },
      graceDays: { schema: { type: 'integer', minimum: 0, maximum: 31, default: 0 } },
      moveOutFee: {
        schema: { type: 'integer', minimum: 0, maximum: 100_000_000, default: 300_000 },
      },
    },
  },
  'POST /api/services': { fields: serviceFields },
  'PUT /api/services/{id}': { fields: serviceFields },
  'POST /api/buildings': { fields: buildingFields },
  'PUT /api/buildings/{id}': { fields: buildingFields },
  'POST /api/buildings/{buildingId}/rooms': { fields: { ...roomFields, ...initialReadings } },
  'POST /api/rooms/{id}/maintenance': {
    fields: {
      // Required to switch maintenance on only.
      reason: { schema: { type: 'string', maxLength: 255 } },
      until: { schema: { type: 'string', format: 'date' } },
    },
  },
  'PUT /api/rooms/{id}': { fields: roomFields },
  'POST /api/buildings/{buildingId}/rooms/bulk': {
    fields: {
      areaM2,
      serviceIds,
      ...initialReadings,
      prices: {
        schema: {
          type: 'array',
          maxItems: 200,
          items: {
            type: 'object',
            required: ['code', 'listPrice'],
            properties: {
              code: { type: 'string', maxLength: 12 },
              listPrice: { type: 'integer', minimum: 0, maximum: 1_000_000_000 },
            },
          },
        },
      },
    },
  },
  'POST /api/tenants': {
    fields: {
      buildingId: { schema: { type: 'string', format: 'uuid' }, required: true },
      ...tenantFields,
    },
  },
  'PUT /api/tenants/{id}': {
    fields: {
      ...tenantFields,
      version: { schema: { type: 'integer', minimum: 1 }, required: true },
    },
  },
  'POST /api/tenants/{id}/vehicles': { fields: vehicleFields },
  'PUT /api/tenants/{id}/vehicles/{vehicleId}': { fields: vehicleFields },
  'POST /api/tenants/{id}/documents': {
    fields: {
      kind: { schema: { type: 'string', enum: ['id_front', 'id_back', 'other'] }, required: true },
      fileId: { schema: { type: 'string', format: 'uuid' }, required: true },
    },
  },
  'POST /api/tenants/import': {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'TenantImportCommitInput' } } },
    },
  },
  'POST /api/uploads': {
    fields: {
      purpose: {
        schema: {
          type: 'string',
          enum: ['tenant_document', 'expense_receipt', 'contract_meter', 'maintenance_photo'],
        },
        required: true,
      },
      buildingId: { schema: { type: 'string', format: 'uuid' }, required: true },
    },
  },
  'PUT /api/buildings/{id}/prices': {
    fields: {
      serviceId: { schema: { type: 'string', format: 'uuid' }, required: true },
      effectiveFrom: { schema: { type: 'string', format: 'date' }, required: true },
      price: {
        schema: { type: ['integer', 'null'], minimum: 0, maximum: 1_000_000_000 },
        required: true,
      },
    },
  },
};

for (const action of [
  'renew',
  'rent-change',
  'occupants',
  'vehicles',
  'services',
  'room-change',
  'occupants/{occupantId}/leave',
]) {
  const key = `POST /api/contracts/{id}/${action}`;
  const fields = {
    renew: 'endDate (new end date), optional rent from effectiveDate.',
    'rent-change': 'rent (integer VND).',
    occupants:
      'tenantId OR inline fullName + phone (10 digits starting 0). Enforces room maxOccupants.',
    'occupants/{occupantId}/leave':
      'occupantId is the tenantId from the contract occupant DTO. newPrimaryTenantId required when the primary leaves. Last occupant cannot leave.',
    vehicles: 'vehicleId, enabled=true (add) / false (remove).',
    services: 'serviceId, enabled=true (on) / false (off). Active definitions only.',
    'room-change':
      'roomId (same building), rent, closingElectric, closingWater, initialElectric, initialWater (nonnegative integers). Occupied/maintenance target: 409. Lower readings: 422. Room moves are recorded in increasing effective-date order.',
  }[action];
  OPERATIONS[key] = [
    `Thay đổi hợp đồng: ${action}`,
    `${fields} ${VERSION_NOTE} Chỉ active/ending. effectiveDate trong thời hạn hợp đồng. preview=true kiểm tra cùng quy tắc nhưng không ghi dữ liệu. Trả ảnh hưởng hoá đơn theo ngày phát hành; cảnh báo kỳ đã phát hành để điều chỉnh kỳ sau. Room change giữ chỉ số cuối phòng cũ cho ST-14. toDate là ngày rời đi (exclusive).`,
  ];
  OVERRIDES[key] = {
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { ref: 'ContractChangeInput' } } },
    },
    response: { ref: 'ContractChangeResult' },
    parameters: [
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: false,
        schema: { type: 'string', minLength: 8, maxLength: 128 },
      },
    ],
  };
}

const healthResponse = (properties) => ({
  description: 'Service sẵn sàng',
  content: { 'application/json': { schema: { type: 'object', properties } } },
});

export default {
  appRoot,
  title: 'Stay API',
  generateCommand: 'pnpm --filter @stay/api openapi:generate',
  contractFiles: [
    // Only the envelope types of the P4 contract; Stay DTOs come from @stay/shared.
    { file: 'libs/shared/src/index.ts', names: ['ApiError', 'PaginationMeta'] },
    'libs/stay/shared/src/ability.ts',
    'libs/stay/shared/src/account.ts',
    'libs/stay/shared/src/member.ts',
    'libs/stay/shared/src/automation.ts',
    'libs/stay/shared/src/notification.ts',
    'libs/stay/shared/src/audit.ts',
    'libs/stay/shared/src/building.ts',
    'libs/stay/shared/src/constants.ts',
    'libs/stay/shared/src/contract.ts',
    'libs/stay/shared/src/room.ts',
    'libs/stay/shared/src/settings.ts',
    'libs/stay/shared/src/tenant.ts',
    'libs/stay/shared/src/upload.ts',
    'libs/stay/shared/src/expense.ts',
    'libs/stay/shared/src/deposit.ts',
    'libs/stay/shared/src/reading.ts',
    'libs/stay/shared/src/invoice.ts',
    'libs/stay/shared/src/payment.ts',
    'libs/stay/shared/src/overview.ts',
    'libs/stay/shared/src/portal.ts',
    'libs/stay/shared/src/requests.ts',
    'libs/stay/shared/src/maintenance.ts',
    'libs/stay/shared/src/resident.ts',
    'libs/stay/shared/src/report.ts',
  ],
  metadata: { API_DESCRIPTION, OPERATIONS, OVERRIDES, TAG_DESCRIPTIONS },
  sessionCookie: 'stay.session_token',
  authTagDescription:
    'Better Auth native endpoints. Browser clients use @stay/sdk/auth and HttpOnly `stay.*` session cookies.',
  appRoutes: [
    [
      'get',
      '/health/live',
      'operations',
      {
        description: '**Công khai.**',
        security: [],
        responses: { 200: healthResponse({ status: { type: 'string' } }) },
      },
    ],
    [
      'get',
      '/health',
      'operations',
      {
        description: '**Công khai.**',
        security: [],
        responses: {
          200: healthResponse({
            status: { type: 'string' },
            service: { type: 'string' },
            database: { type: 'string', enum: ['up', 'down'] },
          }),
          503: { description: 'Database không sẵn sàng' },
        },
      },
    ],
  ],
};
