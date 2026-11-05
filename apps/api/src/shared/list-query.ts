import type { ListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import { InputValidError } from '@/utils/errors/index.js';
import { dateRange } from './list-filters.js';
import validate from './validation.js';

export const uuidQueryRule =
  'sometimes|required|regex:/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/';

export const dateQueryRule =
  'sometimes|required|date|regex:/^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?Z)?$/';

export type ListLocals<Query> = { listQuery: Query };

export function queryText(query: Request['query'], field: string) {
  const value = query[field];
  return typeof value === 'string' ? value.trim() : undefined;
}

export function queryNumber(query: Request['query'], field: string) {
  const value = queryText(query, field);
  return value === undefined ? undefined : Number(value);
}

export function dateFilters(query: Request['query'], t: Request['t']) {
  const createdFrom = queryText(query, 'createdFrom');
  const createdTo = queryText(query, 'createdTo');
  const end = dateRange(createdFrom, createdTo)[Op.lte];

  if (createdFrom && end && new Date(createdFrom) > end) {
    throw new InputValidError(t('error:input_valid_error'), {
      createdTo: [t('error:invalid_date_range')],
    });
  }

  return { createdFrom, createdTo };
}

export function validateListQuery<
  SortField extends string,
  Query extends ListQuery<SortField>,
>(options: {
  sortFields: readonly SortField[];
  defaultSort: SortField;
  defaultOrder?: 'asc' | 'desc';
  rules: (query: Request['query']) => Record<string, string>;
  normalize: (query: Request['query'], base: ListQuery<SortField>, req: Request) => Query;
  legacy?: boolean;
  unpaginatedFields?: readonly string[];
}) {
  return (
    req: Request,
    res: Response<unknown, ListLocals<Query | undefined>>,
    next: NextFunction,
  ) => {
    const pageSize = Number(queryText(req.query, 'pageSize') ?? 10);
    const maxPage = Math.floor(
      Number.MAX_SAFE_INTEGER / (pageSize >= 1 && pageSize <= 100 ? pageSize : 10),
    );
    const rules = {
      page: `sometimes|required|integer|regex:/^\\d+$/|min:1|max:${maxPage}`,
      pageSize: 'sometimes|required|integer|regex:/^\\d+$/|min:1|max:100',
      q: 'string|max:255',
      sortBy: `sometimes|required|in:${options.sortFields.join(',')}`,
      sortOrder: 'sometimes|required|in:asc,desc',
      ...options.rules(req.query),
    };

    validate({ source: 'query', rules })(req, res, (error?: unknown) => {
      if (error) return next(error);

      const hasListQuery = Object.keys(rules).some(
        (field) => !options.unpaginatedFields?.includes(field) && req.query[field] !== undefined,
      );
      res.locals.listQuery =
        options.legacy && !hasListQuery
          ? undefined
          : options.normalize(
              req.query,
              {
                page: Number(req.query.page ?? 1),
                pageSize,
                q: queryText(req.query, 'q') ?? '',
                sortBy:
                  options.sortFields.find((field) => field === queryText(req.query, 'sortBy')) ??
                  options.defaultSort,
                sortOrder:
                  queryText(req.query, 'sortOrder') === 'desc'
                    ? 'desc'
                    : queryText(req.query, 'sortOrder') === 'asc'
                      ? 'asc'
                      : (options.defaultOrder ?? 'asc'),
              },
              req,
            );
      next();
    });
  };
}
