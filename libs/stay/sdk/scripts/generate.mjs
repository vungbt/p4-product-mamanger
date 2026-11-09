// Generates src/shared/generated.ts from apps/stay/api/openapi.yaml; `--check` fails when stale.
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const target = new URL('../src/shared/generated.ts', import.meta.url);
const source = new URL('../../../../apps/stay/api/openapi.yaml', import.meta.url);
const unformatted = astToString(await openapiTS(source, { alphabetize: true }));
const formatted = spawnSync(
  'pnpm',
  ['-w', 'exec', 'biome', 'format', `--stdin-file-path=${fileURLToPath(target)}`],
  { input: unformatted, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
);

if (formatted.status !== 0) throw new Error('Cannot format the generated SDK contract.');

const generated = formatted.stdout;

if (process.argv.includes('--check')) {
  const existing = await readFile(target, 'utf8').catch(() => '');

  if (existing !== generated)
    throw new Error('Stay SDK contract is stale. Run pnpm --filter @stay/sdk generate.');
} else await writeFile(target, generated);
