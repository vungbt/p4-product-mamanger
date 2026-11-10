import { BaseError } from '@p4/server-core';
import type { ErrorRequestHandler } from 'express';

/**
 * Outside production, logs unexpected errors (not `BaseError`) with message and stack to stdout
 * before the shared `handleErrorApi` answers 500 `server_error` (which only logs the name).
 * Production keeps the redacted shared log: messages may contain SQL values.
 */
export const logUnexpectedErrors: ErrorRequestHandler = (err, req, _res, next) => {
  if (!(err instanceof BaseError)) {
    const error = err instanceof Error ? err : new Error(String(err));

    console.log(
      JSON.stringify({
        event: 'api.unexpected_error',
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        error: error.name,
        message: error.message,
        stack: error.stack,
      }),
    );
  }
  next(err);
};
