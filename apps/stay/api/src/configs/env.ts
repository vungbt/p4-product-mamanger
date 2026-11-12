import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// apps/stay/api/{src,dist}/configs → monorepo root .env (shared with P4; Stay reads STAY_*).
dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env'),
  quiet: true,
});

/** Local web origins of @stay/web, trusted outside production only. */
export const LOCAL_WEB_ORIGINS = ['http://localhost:5174', 'http://127.0.0.1:5174'];

function parseOrigins(raw: string | undefined): boolean | string[] {
  if (!raw || raw.trim() === '*') return true;

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const port = Number(process.env.STAY_PORT) || 3011;

/** A positive limit from `name`, honoured outside production only (CI raises the limits). */
function testableLimit(name: string, fallback: number): number {
  const value = Number(process.env[name]);

  return nodeEnv !== 'production' && Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export const env = {
  port,
  nodeEnv,
  isProd: nodeEnv === 'production',
  /** Run the automation/outbox worker inside the API process (one Node process on small servers). */
  inlineWorker: process.env.STAY_INLINE_WORKER === 'true',
  // Sign-in attempts per window. Only overridable outside production (CI signs in many times).
  signInRateLimit:
    nodeEnv !== 'production' && Number(process.env.STAY_SIGN_IN_RATE_LIMIT) > 0
      ? Number(process.env.STAY_SIGN_IN_RATE_LIMIT)
      : 30,
  /**
   * Tenant portal (ST-25), per 15 minutes: session attempts per client IP and per link token,
   * and link lookups per IP. Only overridable outside production (CI opens many sessions).
   */
  portalRateLimits: {
    sessionsPerIp: testableLimit('STAY_PORTAL_SESSION_RATE_LIMIT', 30),
    sessionsPerToken: testableLimit('STAY_PORTAL_TOKEN_RATE_LIMIT', 5),
    lookupsPerIp: testableLimit('STAY_PORTAL_LOOKUP_RATE_LIMIT', 120),
  },
  corsOrigin: parseOrigins(process.env.STAY_CORS_ORIGIN ?? LOCAL_WEB_ORIGINS[0]),
  defaultLocale: process.env.LOCALE_DEFAULT || 'vi',
  database: {
    host: process.env.STAY_DATABASE_HOST || 'localhost',
    port: Number(process.env.STAY_DATABASE_PORT || 5432),
    name: process.env.STAY_DATABASE_NAME || 'p4_stay',
    username: process.env.STAY_DATABASE_USERNAME || 'postgres',
    password: process.env.STAY_DATABASE_PASSWORD || 'postgres',
  },
  auth: {
    /** Public origin of this API (Better Auth callbacks, cookie origin). */
    url: process.env.STAY_BETTER_AUTH_URL || `http://127.0.0.1:${port}`,
    secret: process.env.STAY_BETTER_AUTH_SECRET || 'stay-dev-secret-change-me-0123456789abcdef',
  },
  google: {
    clientId: process.env.STAY_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.STAY_GOOGLE_CLIENT_SECRET || '',
  },
  /**
   * Private uploads (CCCD photos). Without all three Cloudinary values the API uses a local stub
   * storage outside production (tests, CI); production then refuses uploads.
   */
  cloudinary: {
    cloudName: process.env.STAY_CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.STAY_CLOUDINARY_API_KEY || '',
    apiSecret: process.env.STAY_CLOUDINARY_API_SECRET || '',
    folder: process.env.STAY_CLOUDINARY_FOLDER || 'stay',
    apiUrl: process.env.STAY_CLOUDINARY_API_URL || 'https://api.cloudinary.com/v1_1',
  },
  /** Directory of the stub storage (non-production only). */
  uploadStubDir: process.env.STAY_UPLOAD_STUB_DIR || '',
  /**
   * Public origin of @stay/web for invoice share links (`/i/:token`). Without it, links use the
   * caller's allowed web origin, else the first configured CORS origin.
   */
  webUrl: process.env.STAY_WEB_URL?.replace(/\/$/, '') || undefined,
  /** Server URL shown in the API reference; defaults to the current origin. */
  publicApiUrl: process.env.STAY_PUBLIC_API_URL,
  /** SMTP for notification emails (worker). Without a host, email is disabled. */
  smtp: {
    host: process.env.STAY_SMTP_HOST?.trim() || '',
    port: Number(process.env.STAY_SMTP_PORT) || 1025,
    secure: ['true', '1'].includes((process.env.STAY_SMTP_SECURE ?? '').trim().toLowerCase()),
    user: process.env.STAY_SMTP_USER?.trim() || '',
    password: process.env.STAY_SMTP_PASSWORD || '',
    from: process.env.STAY_MAIL_FROM?.trim() || 'no-reply@stay.local',
  },
  /** Web Push (VAPID). Without both keys, browser notifications are disabled. */
  webPush: {
    publicKey: process.env.STAY_VAPID_PUBLIC_KEY?.trim() || '',
    privateKey: process.env.STAY_VAPID_PRIVATE_KEY?.trim() || '',
    subject:
      process.env.STAY_VAPID_SUBJECT?.trim() ||
      `mailto:${process.env.STAY_MAIL_FROM?.trim() || 'no-reply@stay.local'}`,
  },
};

/** Email channel configured (SMTP host set). */
export const emailEnabled = () => Boolean(env.smtp.host);

/** Browser push configured (both VAPID keys set). */
export const pushEnabled = () => Boolean(env.webPush.publicKey && env.webPush.privateKey);
