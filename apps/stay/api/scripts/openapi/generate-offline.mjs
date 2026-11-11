/** Generate Stay's business contract without a DB; preserve the committed Better Auth section.
 * Run after @stay/api build: node scripts/openapi/generate-offline.mjs (from apps/stay/api).
 */
import { spawnSync } from 'node:child_process';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { FILE_RESPONSES } from './config.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../../../../..');
const app = path.resolve(directory, '../..');
const specPath = path.join(app, 'openapi.yaml');
const original = await readFile(specPath, 'utf8');
const committed = YAML.parse(original);

if (!Object.keys(committed.paths).some((url) => url.startsWith('/api/auth/')))
  throw new Error('Missing committed auth contract');
let source = await readFile(path.join(root, 'apps/api/scripts/openapi/generate.mjs'), 'utf8');
const start = source.indexOf('const { auth, authPool, authAuditActions }');
const end = source.indexOf('await authPool.end();', start) + 'await authPool.end();'.length;

source =
  source.slice(0, start) +
  `
const committed = YAML.parse(await readFile(SPEC_PATH, 'utf8'));
for (const [url, item] of Object.entries(committed.paths))
  if (url.startsWith('/api/auth/')) spec.paths[url] = item;
for (const section of ['schemas', 'securitySchemes'])
  for (const [name, item] of Object.entries(committed.components[section]))
    if (name.startsWith('Auth_')) spec.components[section][name] = item;
spec.tags.push({ name: 'auth-native', description: config.authTagDescription });
` +
  source.slice(end);
source = source.replace(
  "const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');",
  `const REPO_ROOT = ${JSON.stringify(root)};`,
);
const temporary = path.join(directory, '.offline-generator.mjs');
// Routers import the auth middleware; no auth operations execute while reading route metadata.
const loader = `export async function load(url, context, next) {
  if (url.endsWith('/dist/configs/better-auth.js')) return { format: 'module', shortCircuit: true, source: 'export const auth = { api: {} };' };
  return next(url, context);
}`;
const initialize = `import { register } from 'node:module'; register(${JSON.stringify(`data:text/javascript,${encodeURIComponent(loader)}`)}, import.meta.url);`;

try {
  await writeFile(temporary, source);
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      `data:text/javascript,${encodeURIComponent(initialize)}`,
      temporary,
      '--config',
      path.join(directory, 'config.mjs'),
      ...(process.argv.includes('--report') ? ['--report'] : []),
    ],
    { cwd: root, stdio: 'inherit' },
  );

  if (result.status !== 0) throw new Error('OpenAPI generation failed');
  const spec = YAML.parse(await readFile(specPath, 'utf8'));

  // The shared generator appends parameter overrides. Keep the last definition per name/location.
  for (const item of Object.values(spec.paths)) {
    for (const operation of Object.values(item)) {
      if (!operation?.parameters) continue;
      operation.parameters = [
        ...new Map(
          operation.parameters.map((parameter) => [`${parameter.in}:${parameter.name}`, parameter]),
        ).values(),
      ];
    }
  }

  // The shared generator has a fixed PaginationMeta envelope. Stay adds filtered category totals.
  spec.paths['/api/expenses'].get.responses['200'].content[
    'application/json'
  ].schema.properties.meta = {
    allOf: [
      { $ref: '#/components/schemas/PaginationMeta' },
      {
        type: 'object',
        required: ['totalsByCategory'],
        properties: {
          totalsByCategory: {
            type: 'array',
            items: {
              type: 'object',
              required: ['categoryId', 'amount'],
              properties: {
                categoryId: { type: 'string', format: 'uuid' },
                amount: { type: 'integer' },
              },
            },
          },
        },
      },
    ],
  };
  spec.paths['/api/deposits'].get.responses['200'].content[
    'application/json'
  ].schema.properties.meta = {
    allOf: [
      { $ref: '#/components/schemas/PaginationMeta' },
      {
        type: 'object',
        required: ['totalHeld', 'buildingTotals'],
        properties: {
          totalHeld: { type: 'integer' },
          buildingTotals: {
            type: 'array',
            items: {
              type: 'object',
              required: ['buildingId', 'held'],
              properties: {
                buildingId: { type: 'string', format: 'uuid' },
                held: { type: 'integer' },
              },
            },
          },
        },
      },
    ],
  };
  spec.paths['/api/payments'].get.responses['200'].content[
    'application/json'
  ].schema.properties.meta = {
    allOf: [
      { $ref: '#/components/schemas/PaginationMeta' },
      {
        type: 'object',
        required: ['totals', 'totalAmount'],
        properties: {
          totals: {
            type: 'array',
            description: 'Một dòng cho mỗi phương thức (kể cả 0), không gồm khoản đã huỷ.',
            items: {
              type: 'object',
              required: ['method', 'amount', 'count'],
              properties: {
                method: { type: 'string', enum: ['cash', 'bank_transfer', 'other', 'deposit'] },
                amount: { type: 'integer' },
                count: { type: 'integer' },
              },
            },
          },
          totalAmount: { type: 'integer' },
        },
      },
    ],
  };
  // ST-18: totals over the whole filter and bucket counts (matching `q`, not `bucket`).
  const receivableBuckets = ['not_due', '1_7', '8_30', 'over_30'];
  spec.paths['/api/buildings/{buildingId}/receivables'].get.responses['200'].content[
    'application/json'
  ].schema.properties.meta = {
    allOf: [
      { $ref: '#/components/schemas/PaginationMeta' },
      {
        type: 'object',
        required: ['totalRemaining', 'overdueRemaining', 'invoiceCount', 'buckets'],
        properties: {
          totalRemaining: {
            type: 'integer',
            description: 'Tổng `total − paidTotal` của mọi hoá đơn chưa thu đủ trong bộ lọc.',
          },
          overdueRemaining: { type: 'integer', description: 'Phần đã quá hạn.' },
          invoiceCount: { type: 'integer' },
          buckets: {
            type: 'array',
            description: 'Một dòng cho mỗi nhóm (kể cả 0), theo `q`, không theo `bucket`.',
            items: {
              type: 'object',
              required: ['bucket', 'count', 'remaining'],
              properties: {
                bucket: { type: 'string', enum: receivableBuckets },
                count: { type: 'integer' },
                remaining: { type: 'integer' },
              },
            },
          },
        },
      },
    ],
  };
  // ST-19: `period` is validated in the handler (400 malformed, 422 outside 2000–2099).
  const overview = spec.paths['/api/buildings/{buildingId}/overview'].get;
  overview.responses['400'] = { $ref: '#/components/responses/ValidationError' };
  overview.responses['422'] = {
    description: 'Kỳ ngoài khoảng 2000–2099 (`period_out_of_range`).',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  const paymentInput = spec.components.schemas.PaymentInput;
  paymentInput.properties.amount = {
    type: 'integer',
    minimum: 1,
    maximum: Number.MAX_SAFE_INTEGER,
  };
  paymentInput.properties.paidOn = {
    type: 'string',
    format: 'date',
    description: 'Không sau hôm nay (Asia/Ho_Chi_Minh).',
  };
  paymentInput.properties.reference = { type: ['string', 'null'], maxLength: 120 };
  paymentInput.properties.note = { type: ['string', 'null'], maxLength: 2000 };
  spec.components.schemas.PaymentReverseInput.properties.reason = {
    type: 'string',
    minLength: 1,
    maxLength: 2000,
  };
  spec.paths['/api/invoices/{id}/payments'].post.responses['409'] = {
    description:
      'Hoá đơn chưa phát hành (`invoice_not_issued`), đã void (`invoice_void`), đã thu đủ (`invoice_already_paid`) hoặc key đã dùng với nội dung khác (`idempotency_conflict`).',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  spec.paths['/api/invoices/{id}/payments'].post.responses['422'] = {
    description: 'Số tiền vượt số còn lại (`payment_exceeds_remaining`, `extensions.remaining`).',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  spec.paths['/api/payments/{id}/reverse'].post.responses['409'] = {
    description: 'Bút toán đã được huỷ (`payment_already_reversed`).',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  const depositInput = spec.components.schemas.DepositInput;
  depositInput.properties.amount = {
    type: 'integer',
    minimum: 1,
    maximum: Number.MAX_SAFE_INTEGER,
  };
  depositInput.properties.occurredOn = { type: 'string', format: 'date' };
  depositInput.properties.reason = {
    type: ['string', 'null'],
    maxLength: 2000,
    description:
      'Bắt buộc, không chỉ khoảng trắng khi type=forfeited. Lưu trong note của bút toán.',
  };
  for (const action of [
    'renew',
    'rent-change',
    'occupants',
    'occupants/{occupantId}/leave',
    'vehicles',
    'services',
    'room-change',
  ]) {
    spec.paths[`/api/contracts/{id}/${action}`].post.responses['422'] = {
      description:
        'Thay đổi không hợp lệ: ngày, số người, dịch vụ hoặc chỉ số. Lỗi field trong extensions.',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
    };
  }
  spec.paths['/api/contracts/{id}/deposits'].post.responses['422'] = {
    description: 'Số dư cọc không đủ hoặc số tiền vượt giới hạn an toàn.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  spec.paths['/api/contracts/{id}/settle'].post.responses['409'] = {
    description:
      'Hợp đồng không ở trạng thái active/ending (`contract_not_active`), còn hoá đơn nháp (`contract_has_draft_invoices`, `extensions.invoices`: `SettlementDraftInvoice[]`), đã có chỉ số sau ngày trả phòng (`reading_after_move_out`), đổi phòng sau ngày trả phòng (`contract_has_future_room_change`), `version_conflict` hoặc key đã dùng với nội dung khác (`idempotency_conflict`).',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  spec.paths['/api/contracts/{id}/settle'].post.responses['422'] = {
    description:
      'Ngày trả phòng sau hôm nay hoặc trước ngày bắt đầu, thiếu/nhỏ hơn chỉ số trước (`finalElectric`, `finalWater`), phụ thu thiếu lý do, ảnh không hợp lệ; `invalid_settlement` khi dữ liệu tính tiền không hợp lệ.',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  // ST-25: tenant portal routes use the portal session cookie, never the staff session. The
  // shared generator only knows `authRequired`, so the portal security is declared here.
  spec.components.securitySchemes.portalSession = {
    type: 'apiKey',
    in: 'cookie',
    name: 'stay_portal_session',
    description:
      'Phiên cổng người thuê (ST-25) từ `POST /api/portal/sessions`: HttpOnly, SameSite=Lax, path `/api/portal`, 90 ngày; production dùng tên `__Secure-stay_portal_session`. Không phải phiên Better Auth.',
  };
  const portalPublic = new Set(['/api/portal/links/lookup', 'post /api/portal/sessions']);
  for (const [url, item] of Object.entries(spec.paths)) {
    if (!url.startsWith('/api/portal/') || portalPublic.has(url)) continue;
    for (const [method, operation] of Object.entries(item)) {
      if (portalPublic.has(`${method} ${url}`)) continue;
      operation.security = [{ portalSession: [] }];
      operation.description = operation.description.replace(
        '**Công khai.**',
        '**Yêu cầu phiên cổng người thuê** (cookie `stay_portal_session`).',
      );
      operation.responses['401'] = {
        description:
          'Không có phiên cổng hợp lệ (`portal_session_invalid`): hết hạn, link bị thu hồi, hợp đồng kết thúc quá 30 ngày hoặc người ở đã rời.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
      };
    }
  }
  spec.paths['/api/portal/sessions'].post.responses['401'] = {
    description:
      'Link không đúng/đã thu hồi/hết hạn hoặc sai 4 số cuối (`portal_verification_failed`, không phân biệt).',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  spec.paths['/api/portal/sessions'].post.responses['429'] = {
    description:
      'Quá số lần thử theo IP/token (`rate_limit_exceeded`) hoặc link đang bị khoá sau 5 lần sai (`portal_link_locked`, `extensions.retryAfterSeconds`).',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  spec.paths['/api/contracts/{id}/portal-links'].post.responses['422'] = {
    description: 'Người thuê không còn ở trong hợp đồng (`portal_tenant_not_occupant`).',
    content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
  };
  for (const [url, response] of Object.entries(FILE_RESPONSES)) {
    spec.paths[url].post.responses['200'] = response;
  }
  const output = YAML.stringify(spec, { lineWidth: 120, aliasDuplicateObjects: false });

  if (process.argv.includes('--check')) {
    await writeFile(specPath, original);
    if (output !== original)
      throw new Error('openapi.yaml is out of date; regenerate the Stay contract.');
  } else await writeFile(specPath, output);
} finally {
  await unlink(temporary).catch(() => {});
}
