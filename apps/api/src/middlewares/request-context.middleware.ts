import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { requestStore } from '@/shared/request-store.js';

export const requestContext: RequestHandler = (req, res, next) => {
  const supplied = req.header('x-request-id');
  const requestId = supplied && /^[a-zA-Z0-9_-]{8,80}$/.test(supplied) ? supplied : randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  const context: import('@/shared/request-store.js').RequestContext = { requestId, source: 'http' };
  const started = Date.now();
  res.on('finish', () => {
    console.info(
      JSON.stringify({
        event: 'http.request',
        requestId,
        actorId: context.user?.id ?? null,
        method: req.method,
        route: context.route ?? req.route?.path ?? 'unmatched',
        action: context.audit?.action ?? context.authAction,
        status: res.statusCode,
        durationMs: Date.now() - started,
      }),
    );
  });
  requestStore.run(context, next);
};
