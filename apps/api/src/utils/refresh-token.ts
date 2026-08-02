import { createHash, randomBytes } from 'node:crypto';

/** Parse durations like `15m`, `7d`, `1h` into milliseconds */
export function parseDurationMs(raw: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(raw.trim());
  if (!match) {
    throw new Error(`Invalid duration: ${raw}`);
  }
  const value = Number(match[1]);
  const unit = match[2] as 'ms' | 's' | 'm' | 'h' | 'd';
  const multipliers = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return value * multipliers[unit];
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function refreshExpiresAt(expiresIn: string): Date {
  return new Date(Date.now() + parseDurationMs(expiresIn));
}
