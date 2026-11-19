import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Node strips TypeScript; mirror Vite's @/ alias and extension resolution for unit tests.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const url = specifier.startsWith('@/')
      ? new URL(`../src/${specifier.slice(2)}`, import.meta.url)
      : specifier.startsWith('.') && !extname(specifier) && context.parentURL
        ? new URL(specifier, context.parentURL)
        : undefined;

    if (url) {
      for (const suffix of ['', '.ts', '.tsx', '.mjs']) {
        const candidate = new URL(`${url.href}${suffix}`);
        if (existsSync(fileURLToPath(candidate))) {
          return nextResolve(candidate.href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
