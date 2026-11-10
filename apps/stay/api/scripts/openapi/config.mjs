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
  buildings: 'Toà nhà, kỳ thu và tài khoản nhận tiền theo toà, đơn giá ghi đè theo ngày.',
  me: 'Người dùng hiện tại và quyền CASL.',
  operations: 'Kiểm tra trạng thái dịch vụ.',
  rooms:
    'Phòng theo toà, sơ đồ phòng, tạo nhanh nhiều phòng, đồng hồ điện/nước và bảo trì. Trạng thái phòng suy ra từ hợp đồng.',
  settings: 'Cấu hình hệ thống: kỳ thu mặc định và danh mục dịch vụ, đơn giá mặc định.',
};

const BILLING_DAY_NOTE =
  'Ngày trong tháng `1`–`28`, hoặc `31` = cuối tháng. Hạn thanh toán phải ≥ ngày phát hành.';
const VERSION_NOTE =
  'Gửi lại `version` đã đọc; dữ liệu đã bị người khác sửa thì trả 409 `version_conflict`.';

const OPERATIONS = {
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
const roomFields = { areaM2, serviceIds };

const OVERRIDES = {
  'PUT /api/settings': {
    fields: { roundingUnit: { schema: roundingUnit, required: true } },
  },
  'POST /api/buildings': { fields: buildingFields },
  'PUT /api/buildings/{id}': { fields: buildingFields },
  'POST /api/buildings/{buildingId}/rooms': { fields: roomFields },
  'PUT /api/rooms/{id}': { fields: roomFields },
  'POST /api/buildings/{buildingId}/rooms/bulk': {
    fields: {
      areaM2,
      serviceIds,
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
    'libs/stay/shared/src/building.ts',
    'libs/stay/shared/src/constants.ts',
    'libs/stay/shared/src/room.ts',
    'libs/stay/shared/src/settings.ts',
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
