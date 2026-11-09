import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UniqueConstraintError } from 'sequelize';
import * as v from 'valibot';
import { logger } from '../logger.js';
import { isAppError } from '../shared/errors.js';

function translateErrorMessage(req: Request, key: string) {
  const path = `error:${key}`;
  const translated = req.t(path);
  return translated === path ? key : translated;
}

export function handleErrorApi(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (
    err &&
    typeof err === 'object' &&
    'type' in err &&
    (err.type === 'entity.too.large' || err.type === 'entity.parse.failed')
  )
    return res
      .status(err.type === 'entity.too.large' ? 413 : 400)
      .json({ code: 'invalid_request_body', message: 'Invalid request body.' });

  if (v.isValiError(err))
    return res.status(400).json({
      code: 'input_valid_error',
      message: req.t('error:input_valid_error'),
      extensions: { input: err.issues.slice(0, 20).map((issue) => issue.message) },
    });

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

  logger.error(
    JSON.stringify({
      event: 'api.error',
      requestId: req.requestId,
      error: err instanceof Error ? err.name : 'UnknownError',
    }),
  );
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
