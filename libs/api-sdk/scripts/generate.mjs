import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';
import ts from 'typescript';

const target = new URL('../src/shared/generated.ts', import.meta.url);
const source = new URL('../../../apps/api/openapi.yaml', import.meta.url);
const unformatted =
  'export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };\n\n' +
  astToString(
    await openapiTS(source, {
      alphabetize: true,
      transform(_schema, metadata) {
        if (metadata.path === '#/components/schemas/JsonValue')
          return ts.factory.createTypeReferenceNode('JsonValue');
      },
    }),
  );
const formatted = spawnSync(
  'pnpm',
  ['-w', 'exec', 'biome', 'format', '--stdin-file-path=' + fileURLToPath(target)],
  { input: unformatted, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
);
if (formatted.status !== 0) throw new Error('Cannot format the generated SDK contract.');
const generated = formatted.stdout;
if (process.argv.includes('--check')) {
  const existing = await readFile(target, 'utf8');
  if (existing !== generated)
    throw new Error('SDK contract is stale. Run pnpm --filter @p4/api-sdk generate.');
} else await writeFile(target, generated);
