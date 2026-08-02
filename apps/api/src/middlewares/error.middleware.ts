import type { NextFunction, Request, Response } from 'express';
import { isAppError } from '@/utils/errors/index.js';
import { logger } from '@/utils/logger.js';

function translateErrorMessage(req: Request, key: string) {
  const path = `error:${key}`;
  const translated = req.t(path);
  return translated === path ? key : translated;
}

export function handleErrorApi(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      message: translateErrorMessage(req, err.message),
      code: err.code,
      ...(Object.keys(err.extensions).length > 0 ? { extensions: err.extensions } : {}),
    });
  }

  logger.error('[api] Unexpected error:', err);
  return res.status(500).json({
    message: translateErrorMessage(req, 'server_error'),
    code: 'server_error',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    message: translateErrorMessage(req, 'not_found'),
    code: 'not_found',
  });
}
