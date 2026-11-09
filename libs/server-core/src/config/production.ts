/** Values published in `.env*.example` or used as development fallbacks. */
export const PUBLIC_PLACEHOLDERS: readonly RegExp[] = [
  /^replace-with/i,
  /^change-me/i,
  /^p4-dev-secret/i,
];

/** Passwords published in this public repository (seeders and docs). */
export const PUBLIC_DEMO_PASSWORDS: ReadonlySet<string> = new Set([
  'admin123',
  'user123',
  'password123',
]);

/** Throw unless `value` is a private secret of at least `minLength` characters. */
export function assertSecret(
  name: string,
  value: string | undefined,
  minLength: number,
  placeholders: readonly RegExp[] = PUBLIC_PLACEHOLDERS,
) {
  if (!value || value.length < minLength || placeholders.some((p) => p.test(value)))
    throw new Error(
      `Production ${name} must be a private value of at least ${minLength} characters.`,
    );
}

/** In production, published demo passwords never authenticate and cannot be set. */
export function createBlockedPasswordCheck(
  isProd: boolean,
  passwords: ReadonlySet<string> = PUBLIC_DEMO_PASSWORDS,
) {
  return function isBlockedPassword(password: string): boolean {
    return isProd && passwords.has(password);
  };
}

/** The public auth URL must be HTTPS (`BETTER_AUTH_URL`, falling back to `PUBLIC_API_URL`). */
export function assertHttpsAuthUrl(publicUrl: string | undefined) {
  if (!publicUrl || new URL(publicUrl).protocol !== 'https:')
    throw new Error('Production BETTER_AUTH_URL must be the public HTTPS origin.');
}

/** `cors({ origin: true })` reflects any origin; production must list origins explicitly. */
export function assertExplicitCors(corsOrigin: boolean | readonly string[]) {
  if (corsOrigin === true) throw new Error('Production CORS requires explicit allowed origins.');
}

/** Outbound mail transport, when configured, must use HTTPS. */
export function assertHttpsMailTransport(mailApiUrl: string | undefined) {
  if (mailApiUrl && !mailApiUrl.startsWith('https://'))
    throw new Error('Production mail transport requires HTTPS.');
}
