import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// apps/api/src/configs → monorepo root .env
dotenv.config({
  path: path.resolve(__dirname, '../../../../.env'),
  quiet: true,
});

function parseCorsOrigins(raw: string | undefined): boolean | string[] {
  if (!raw || raw.trim() === '*') return true;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: (process.env.NODE_ENV ?? 'development') === 'production',
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN ?? 'http://localhost:5173'),
  runSeed: process.env.RUN_SEED === 'true',
  defaultLocale: process.env.LOCALE_DEFAULT || 'vi',
  jwt: {
    secret: process.env.JWT_SECRET || 'p4-dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    name: process.env.DATABASE_NAME || 'p4_product_manager',
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'p4-product-manager',
    domain: process.env.CLOUDINARY_DOMAIN || 'https://api.cloudinary.com/v1_1',
    get tempFolder() {
      return `${this.folder.replace(/^\/+|\/+$/g, '')}/temp`;
    },
    get assetsFolder() {
      return `${this.folder.replace(/^\/+|\/+$/g, '')}/assets`;
    },
  },
  payment: {
    provider: (process.env.PAYMENT_PROVIDER === 'stripe' ? 'stripe' : 'mock') as 'mock' | 'stripe',
    mockSecret: process.env.PAYMENT_MOCK_SECRET || 'p4-mock-pay-secret',
    defaultShippingFee: Number(process.env.DEFAULT_SHIPPING_FEE || 30000),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripeCurrency: (process.env.STRIPE_CURRENCY || 'vnd').toLowerCase(),
    checkoutSuccessUrl:
      process.env.CHECKOUT_SUCCESS_URL || 'http://localhost:5173/shop/orders/{ORDER_ID}?paid=1',
    checkoutCancelUrl:
      process.env.CHECKOUT_CANCEL_URL || 'http://localhost:5173/shop/cart?cancelled=1',
  },
  google: {
    /** Đọc lúc runtime — restart API sau khi sửa .env */
    get clientId() {
      return process.env.GOOGLE_CLIENT_ID || '';
    },
  },
};
