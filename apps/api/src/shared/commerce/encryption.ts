import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { env } from '@/configs/env.js';

function key() {
  const configured = process.env.MAIL_ENCRYPTION_KEY;
  if (env.isProd && !configured) throw new Error('MAIL_ENCRYPTION_KEY is required');
  return createHash('sha256')
    .update(configured ?? env.jwt.secret)
    .digest();
}

export function seal(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    body.toString('base64url'),
  ].join('.');
}

export function unseal(value: string) {
  const [iv, tag, body] = value.split('.');
  if (!iv || !tag || !body) throw new Error('Invalid encrypted payload');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(body, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
