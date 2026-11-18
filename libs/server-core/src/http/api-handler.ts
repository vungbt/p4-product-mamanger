import type { PaginationMeta } from '@p4/shared';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { TransactionOptions } from 'sequelize';
import { AUDIT_ACTIONS } from '../audit/types.js';
import type { ListLocals } from '../list/list-query.js';
import { requestStore } from '../request-store.js';

/** `auditedTransaction` from `createAuditRuntime`, with an options argument. */
export type AuditedTransactionWithOptions = <T>(
  options: TransactionOptions,
  work: () => Promise<T>,
) => Promise<T>;

/**
 * Route handler wrappers that answer with the `{ data, meta? }` envelope. The OpenAPI generator
 * recognises calls named `apiHandler`, `listHandler` and `optionalListHandler`, so bind them to
 * those names in the app.
 */
export function createApiHandlers(auditedTransaction: AuditedTransactionWithOptions) {
  /** Data-changing routes (per their audit policy) run in one audited transaction. */
  function apiHandler<Data>(
    handler: (req: Request) => Promise<Data>,
    status = 200,
  ): RequestHandler {
    const middleware: RequestHandler = (req, res, next) => {
      const policy = requestStore.getStore()?.audit;
      const run = () => handler(req);
      void (
        policy && AUDIT_ACTIONS[policy.action].changesData
          ? auditedTransaction(policy.transaction ?? {}, run)
          : run()
      )
        .then((data) => res.jsonApi(status, { data }))
        .catch(next);
    };
    return Object.assign(middleware, { apiHandler: handler, successStatus: status });
  }

  /** Paginated list; requires a `validateListQuery` middleware before it. */
  function listHandler<Query, Data>(
    handler: (req: Request, query: Query) => Promise<{ data: Data; meta: PaginationMeta }>,
  ) {
    const middleware = (
      req: Request,
      res: Response<unknown, ListLocals<Query | undefined>>,
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

  /** Legacy picklists remain arrays; supplying list params enables the normal paginated envelope. */
  function optionalListHandler<Query, Data>(
    handler: (
      req: Request,
      query: Query | undefined,
    ) => Promise<{ data: Data; meta?: PaginationMeta }>,
  ) {
    const middleware = (
      req: Request,
      res: Response<unknown, ListLocals<Query | undefined>>,
      next: NextFunction,
    ) => {
      void handler(req, res.locals.listQuery)
        .then((result) => res.jsonApi(200, result))
        .catch(next);
    };
    return Object.assign(middleware, { apiHandler: handler, isList: true, successStatus: 200 });
  }

  return { apiHandler, listHandler, optionalListHandler };
}
