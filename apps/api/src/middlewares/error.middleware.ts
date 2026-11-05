import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UniqueConstraintError } from 'sequelize';
import { isAppError } from '@/utils/errors/index.js';
import { logger } from '@/utils/logger.js';

function translateErrorMessage(req: Request, key: string) {
  const path = `error:${key}`;
  const translated = req.t(path);
  return translated === path ? key : translated;
}

export function handleErrorApi(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof UniqueConstraintError) {
    const fields = new Set([
      ...err.errors.flatMap((error) => (error.path ? [error.path] : [])),
      ...Object.keys(err.fields),
    ]);
    const extensions: Record<string, string[]> = {};

    for (const field of fields) {
      const attributeKey = `validator:attribute.${field}`;
      const translated = req.t(attributeKey);
      const attribute = translated === attributeKey ? field : translated;
      extensions[field] = [req.t('error:unique_value', { attribute })];
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      message: req.t('error:duplicate_value'),
      code: 'input_valid_error',
      ...(fields.size > 0 ? { extensions } : {}),
    });
  }

  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      message: translateErrorMessage(req, err.message),
      code: err.code,
      ...(Object.keys(err.extensions).length > 0 ? { extensions: err.extensions } : {}),
    });
  }

  logger.error('[api] Unexpected error:', err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: translateErrorMessage(req, 'server_error'),
    code: 'server_error',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(StatusCodes.NOT_FOUND).json({
    message: translateErrorMessage(req, 'not_found'),
    code: 'not_found',
  });
}
