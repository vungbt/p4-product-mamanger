import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import * as i18nextMiddleware from 'i18next-http-middleware';
import { env } from '@/configs/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const languageDir = path.resolve(__dirname, '../language');
const baseLang = env.defaultLocale;
const dirBaseLang = path.join(languageDir, baseLang);

const ns = fs
  .readdirSync(dirBaseLang)
  .filter((file) => fs.lstatSync(path.resolve(dirBaseLang, file)).isFile())
  .map((file) => String(file.split('.').shift()));

await i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    ns,
    defaultNS: 'translation',
    fallbackLng: baseLang,
    preload: ['en', 'vi'],
    backend: {
      loadPath: path.join(languageDir, '{{lng}}/{{ns}}.json'),
    },
    detection: {
      order: ['header', 'querystring'],
      lookupHeader: 'accept-language',
      lookupQuerystring: 'lang',
      caches: false,
    },
  });

export const i18nMiddleware = i18nextMiddleware.handle(i18next);
export { i18next };
