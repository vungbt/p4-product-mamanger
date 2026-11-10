/** Generate Stay's business contract without a DB; preserve the committed Better Auth section.
 * Run after @stay/api build: node scripts/openapi/generate-offline.mjs (from apps/stay/api).
 */
import { spawnSync } from 'node:child_process';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

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
  const output = YAML.stringify(spec, { lineWidth: 120, aliasDuplicateObjects: false });

  if (process.argv.includes('--check')) {
    await writeFile(specPath, original);
    if (output !== original)
      throw new Error('openapi.yaml is out of date; regenerate the Stay contract.');
  } else await writeFile(specPath, output);
} finally {
  await unlink(temporary).catch(() => {});
}
