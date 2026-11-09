import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import { QueryTypes, type Sequelize } from 'sequelize';
import { BaseError } from '../shared/errors.js';

/**
 * Fixed-window rate limiting stored in the `rate_limit_buckets` table (`key` primary key,
 * `count`, `reset_at`), so limits hold across API instances. Keyed by user, else client IP.
 */
export function createRateLimit(sequelize: Sequelize) {
  return function rateLimit(namespace: string, max: number, windowMs = 60_000): RequestHandler {
    return (req, res, next) => {
      const key = createHash('sha256')
        .update(`${namespace}:${req.user?.id ?? req.ip ?? 'unknown'}`)
        .digest('hex');
      void sequelize
        .query<{ count: number; resetAt: Date }>(
          `INSERT INTO rate_limit_buckets (key,count,reset_at) VALUES (:key,1,NOW()+(:windowMs * INTERVAL '1 millisecond')) ON CONFLICT (key) DO UPDATE SET count=CASE WHEN rate_limit_buckets.reset_at <= NOW() THEN 1 ELSE LEAST(rate_limit_buckets.count+1,:max + 1) END, reset_at=CASE WHEN rate_limit_buckets.reset_at <= NOW() THEN NOW()+(:windowMs * INTERVAL '1 millisecond') ELSE rate_limit_buckets.reset_at END RETURNING count,reset_at AS "resetAt"`,
          { replacements: { key, windowMs, max }, type: QueryTypes.SELECT },
        )
        .then((rows) => {
          const row = rows[0];
          if (!row)
            throw new BaseError('rate_limiter_unavailable', 503, 'rate_limiter_unavailable');
          if (row.count > max) {
            res.setHeader(
              'Retry-After',
              Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)),
            );
            return next(new BaseError('rate_limit_exceeded', 429, 'rate_limit_exceeded'));
          }
          return next();
        })
        .catch(next);
    };
  };
}
