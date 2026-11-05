import type { NextFunction, Request, RequestHandler, Response } from 'express';

export function apiHandler<Data>(
  handler: (req: Request) => Promise<Data>,
  status = 200,
): RequestHandler {
  const middleware: RequestHandler = (req, res, next) => {
    void handler(req)
      .then((data) => res.jsonApi(status, { data }))
      .catch(next);
  };
  return Object.assign(middleware, { apiHandler: handler, successStatus: status });
}

export function listHandler<Query, Data>(
  handler: (
    req: Request,
    query: Query,
  ) => Promise<{ data: Data; meta: import('@p4/shared').PaginationMeta }>,
) {
  const middleware = (
    req: Request,
    res: Response<unknown, import('./list-query.js').ListLocals<Query | undefined>>,
    next: NextFunction,
  ) => {
    const query = res.locals.listQuery;
    if (!query) return next(new Error('List query middleware is required.'));
    void handler(req, query)
      .then((result) => res.jsonApi(200, result))
      .catch(next);
  };
  return Object.assign(middleware, { apiHandler: handler, isList: true, successStatus: 200 });
}
