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
  me: 'Người dùng hiện tại và quyền CASL.',
  operations: 'Kiểm tra trạng thái dịch vụ.',
};

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
};

const OVERRIDES = {};

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
    'libs/stay/shared/src/constants.ts',
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
