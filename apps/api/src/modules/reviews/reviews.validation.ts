import type { ReviewListQuery } from '@p4/shared';
import { queryNumber, validateListQuery } from '@/shared/list-query.js';
import validate from '@/shared/validation.js';

export const validateReview = validate({
  rules: {
    rating: 'required|integer|min:1|max:5',
    comment: 'string',
  },
});

const sortFields: NonNullable<ReviewListQuery['sortBy']>[] = ['rating', 'createdAt'];

export const validateReviewsListQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  legacy: true,
  rules: () => ({
    rating: 'sometimes|required|integer|min:1|max:5',
  }),
  normalize: (query, base): ReviewListQuery => ({ ...base, rating: queryNumber(query, 'rating') }),
});
