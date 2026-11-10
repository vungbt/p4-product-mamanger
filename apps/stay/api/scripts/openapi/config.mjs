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
  deposits: 'Sổ cọc bất biến; thu thêm, hoàn, mất cọc và cấn trừ thanh lý.',
  readings:
    'Chốt chỉ số điện nước, lưu theo dòng và thay đồng hồ; tiêu thụ tính theo các đoạn đồng hồ.',
  expenses: 'Chi phí vận hành, danh mục chi phí và tổng theo kỳ. Ảnh hoá đơn lưu private.',
  contracts:
    'Hợp đồng thuê, kích hoạt (tạo hoá đơn nhận phòng nháp), huỷ bản nháp và xem trước tiền nhận phòng.',
  invoices:
    'Hoá đơn: xem trước và tạo bản nháp kỳ M (tiền phòng + dịch vụ M, điện nước M−1), phụ thu/giảm trừ, phát hành (cấp mã, khoá chỉ số), void. Mọi số tiền tính bằng `@stay/billing` tại server; dòng hoá đơn là snapshot.',
  payments:
    'Thu tiền hoá đơn (một hoặc nhiều lần), sổ thu và huỷ bút toán thu. Thanh toán không sửa/xoá; `paidTotal` và trạng thái hoá đơn luôn tính lại từ tổng các khoản chưa huỷ trong cùng transaction.',
  audit: 'Lịch sử thay đổi đã ẩn dữ liệu nhạy cảm.',
  buildings: 'Toà nhà, kỳ thu và tài khoản nhận tiền theo toà, đơn giá ghi đè theo ngày.',
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
  'Ngày trong tháng `1`–`28`, hoặc `31` = cuối tháng. Hạn thanh toán phải ≥ ngày phát hành.';
const VERSION_NOTE =
  'Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.';

const TENANT_FIELDS_NOTE =
  'Chỉ bắt buộc `fullName` và `phone` (10 số, bắt đầu 0; nhận cả `+84`, khoảng trắng, dấu chấm và tự chuẩn hoá). CCCD 12 số, duy nhất toàn hệ thống: trùng → 400 với `extensions.idNumber` và `extensions.duplicateTenant` (`tenantId` chỉ có khi người dùng được xem hồ sơ đó). Ngày dạng `YYYY-MM-DD` (hoặc `dd/MM/yyyy`), không sau hôm nay. Không tự điền giá trị nào.';

const OPERATIONS = {
  'GET /api/deposits': ['Sổ cọc', 'Tổng theo toàn bộ bộ lọc trước phân trang.'],
  'GET /api/contracts/{id}/deposits': ['Lịch sử bút toán cọc'],
  'POST /api/contracts/{id}/deposits': [
    'Thêm bút toán cọc',
    'Bất biến; số dư âm trả 422; applied chỉ dành cho ST-17.',
  ],
  'GET /api/buildings/{buildingId}/readings': [
    'Chỉ số điện nước toàn toà',
    'Kỳ là tháng tiêu thụ (YYYY-MM). Bao gồm phòng có hợp đồng active/ending, chỉ số trước, tiêu thụ cả hai đoạn khi thay đồng hồ, trung bình tối đa 3 kỳ trước, cảnh báo và trạng thái draft/locked. Ngoài phạm vi quản lý trả 404.',
  ],
  'PUT /api/buildings/{buildingId}/readings': [
    'Lưu chỉ số theo dòng',
    'Mỗi dòng gửi meterId, period, reading, readOn và version (0 khi tạo). Trả results theo thứ tự đầu vào; dòng lỗi không huỷ dòng hợp lệ. Chỉ số nguyên không âm; số mới nhỏ hơn số cũ bị chặn. Tiêu thụ hơn 2 lần trung bình cần confirmHighConsumption. Version cũ trả lỗi dòng 409; locked không sửa được. Ảnh dùng private upload purpose contract_meter.',
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
    'Lọc buildingId, period, kind, status, roomId, contractId, overdue=true|false (quá hạn suy ra: issued/partially_paid, quá dueOn theo Asia/Ho_Chi_Minh, còn nợ). `q` tìm theo mã hoá đơn hoặc mã phòng. Người thuê chỉ thấy hoá đơn đã phát hành của hợp đồng mình.',
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
    'Ngày chốt số, ngày phát hành, hạn thanh toán, đơn vị làm tròn, hoàn tiền phòng và mẫu nội dung chuyển khoản. Toà để trống trường nào thì theo giá trị ở đây.',
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
    'Tên không trùng (không phân biệt hoa thường); đơn giá số nguyên VND ≥ 0. Chỉ một dịch vụ `electricity` và một `water` đang bật. `code` sinh từ tên; `kind` không đổi được sau khi tạo.',
  ],
  'PUT /api/services/{id}': [
    'Sửa dịch vụ',
    `Sửa tên, đơn vị, đơn giá mặc định, thứ tự, bật/tắt. Không xoá dịch vụ: chỉ tắt. Đổi giá không ảnh hưởng hoá đơn đã phát hành. ${VERSION_NOTE}`,
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
  issueDay: { schema: billingDay },
  dueDay: { schema: billingDay },
  roundingUnit: { schema: { type: ['integer', 'null'], enum: [...roundingUnit.enum, null] } },
  refundUnusedRent: { schema: { type: ['boolean', 'null'] } },
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
const OVERRIDES = {
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
    fields: { roundingUnit: { schema: roundingUnit, required: true } },
  },
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
        schema: { type: 'string', enum: ['tenant_document', 'expense_receipt', 'contract_meter'] },
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
