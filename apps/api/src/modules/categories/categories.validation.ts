import { type CategoryListQuery, DESCRIPTION_FILTER_VALUES } from '@p4/shared';
import { type ListLocals, queryText, validateListQuery } from '@/shared/list-query.js';
import validate from '@/shared/validation.js';

export const validateCategory = validate({
  rules: {
    name: 'required|string',
    slug: 'required|string',
    description: 'string',
  },
});

const sortFields: NonNullable<CategoryListQuery['sortBy']>[] = ['name', 'slug', 'description'];

export type CategoryListLocals = ListLocals<CategoryListQuery | undefined>;

export const validateCategoryListQuery = validateListQuery({
  sortFields,
  defaultSort: 'name',
  legacy: true,
  rules: () => ({ description: `sometimes|required|in:${DESCRIPTION_FILTER_VALUES.join(',')}` }),
  normalize: (query, base): CategoryListQuery => ({
    ...base,
    description:
      DESCRIPTION_FILTER_VALUES.find((value) => value === queryText(query, 'description')) ?? 'all',
  }),
});
