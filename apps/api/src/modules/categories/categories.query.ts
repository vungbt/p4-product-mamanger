import type { CategoryListQuery } from '@p4/shared';
import { BadRequest } from '@/utils/errors/index.js';

const fields = ['page', 'pageSize', 'q', 'description', 'sortBy', 'sortOrder'] as const;

/** No list parameters preserves the legacy unpaginated response. */
export function parseCategoryListQuery(
  query: Record<string, unknown>,
): CategoryListQuery | undefined {
  if (!fields.some((field) => query[field] !== undefined)) return undefined;

  const text = (field: (typeof fields)[number], fallback: string) => {
    const value = query[field];
    if (value === undefined) return fallback;
    if (typeof value !== 'string')
      throw new BadRequest('invalid_pagination', { [field]: ['Expected a single string value.'] });
    return value.trim();
  };

  const integer = (field: 'page' | 'pageSize', fallback: number, max: number) => {
    const raw = text(field, String(fallback));
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 1 || value > max) {
      throw new BadRequest('invalid_pagination', {
        [field]: [`Expected an integer between 1 and ${max}.`],
      });
    }
    return value;
  };

  const pageSize = integer('pageSize', 10, 100);
  const page = integer('page', 1, Math.floor(Number.MAX_SAFE_INTEGER / pageSize));
  const sortBy = text('sortBy', 'name');
  const sortOrder = text('sortOrder', 'asc');
  const description = text('description', 'all');
  const q = text('q', '');

  if (!['name', 'slug', 'description'].includes(sortBy)) {
    throw new BadRequest('invalid_pagination', {
      sortBy: ['Allowed values: name, slug, description.'],
    });
  }
  if (!['asc', 'desc'].includes(sortOrder)) {
    throw new BadRequest('invalid_pagination', { sortOrder: ['Allowed values: asc, desc.'] });
  }
  if (!['all', 'has', 'none'].includes(description)) {
    throw new BadRequest('invalid_pagination', {
      description: ['Allowed values: all, has, none.'],
    });
  }
  if (q.length > 255)
    throw new BadRequest('invalid_pagination', { q: ['Maximum 255 characters.'] });

  return {
    page,
    pageSize,
    q,
    sortBy: sortBy as CategoryListQuery['sortBy'],
    sortOrder: sortOrder as CategoryListQuery['sortOrder'],
    description: description as CategoryListQuery['description'],
  };
}
