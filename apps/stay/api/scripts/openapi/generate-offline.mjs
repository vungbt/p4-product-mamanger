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
  const output = YAML.stringify(spec, { lineWidth: 120, aliasDuplicateObjects: false });

  if (process.argv.includes('--check')) {
    await writeFile(specPath, original);
    if (output !== original)
      throw new Error('openapi.yaml is out of date; regenerate the Stay contract.');
  } else await writeFile(specPath, output);
} finally {
  await unlink(temporary).catch(() => {});
}
