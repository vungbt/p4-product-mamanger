import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { requestStore } from '@/shared/request-store.js';

export const requestContext: RequestHandler = (req, res, next) => {
  const supplied = req.header('x-request-id');
  const requestId = supplied && /^[a-zA-Z0-9_-]{8,80}$/.test(supplied) ? supplied : randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  requestStore.run({ requestId }, next);
};
