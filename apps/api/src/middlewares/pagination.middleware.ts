import type { NextFunction, Request, Response } from 'express';
import { errorKeys } from '@/constants/index.js';
import { BadRequest } from '@/utils/errors/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function paginationMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const pageRaw = Number.parseInt(String(req.query.page ?? DEFAULT_PAGE), 10);
    const pageSizeRaw = Number.parseInt(String(req.query.pageSize ?? DEFAULT_PAGE_SIZE), 10);

    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : DEFAULT_PAGE;
    let pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : DEFAULT_PAGE_SIZE;
    pageSize = Math.min(pageSize, MAX_PAGE_SIZE);

    const offset = (page - 1) * pageSize;
    const q = String(req.query.q ?? '').trim();

    req.pagination = { page, pageSize, offset, limit: pageSize, q };
    next();
  } catch {
    next(new BadRequest(errorKeys.invalidPagination));
  }
}
