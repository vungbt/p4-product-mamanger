import type { PaginationMeta } from '@p4/shared';

export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const offset = (page - 1) * pageSize;
  const data = items.slice(offset, offset + pageSize);
  return {
    data,
    meta: buildPaginationMeta(page, pageSize, total),
  };
}
