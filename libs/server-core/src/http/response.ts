import type { ApiPaginatedSuccess, ApiSuccess } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';

function translateMessage(req: Request, message?: string) {
  if (!message) return message;
  if (message.startsWith('message:') || message.startsWith('error:')) {
    return req.t(message);
  }
  return message;
}

/** Gắn `res.jsonApi` + dịch message: / error: keys */
export function baseMiddleware(req: Request, res: Response, next: NextFunction) {
  res.jsonApi = <T>(status: number, body: ApiSuccess<T> | ApiPaginatedSuccess<T>) => {
    if (body.message) {
      body = { ...body, message: translateMessage(req, body.message) };
    }
    return res.status(status).json(body);
  };
  next();
}
