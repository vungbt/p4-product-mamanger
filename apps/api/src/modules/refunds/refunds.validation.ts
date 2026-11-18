import {
  dateFilters,
  dateQueryRule,
  queryNumber,
  queryText,
  uuidQueryRule,
  validateListQuery,
} from '@p4/server-core';
import type { RefundListQuery } from '@p4/shared';

const sortFields: NonNullable<RefundListQuery['sortBy']>[] = ['amount', 'status', 'createdAt'];
const statuses: NonNullable<RefundListQuery['status']>[] = ['pending', 'completed', 'failed'];

export const validateRefundsListQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  legacy: true,
  unpaginatedFields: ['orderId'],
  rules: (query) => ({
    orderId: uuidQueryRule,
    status: `sometimes|required|in:${statuses.join(',')}`,
    minAmount: 'sometimes|required|numeric|min:0|max:2147483647',
    maxAmount: `sometimes|required|numeric|min:${queryNumber(query, 'minAmount') ?? 0}|max:2147483647`,
    createdFrom: dateQueryRule,
    createdTo: dateQueryRule,
  }),
  normalize: (query, base, req): RefundListQuery => ({
    ...base,
    status: statuses.find((value) => value === queryText(query, 'status')),
    minAmount: queryNumber(query, 'minAmount'),
    maxAmount: queryNumber(query, 'maxAmount'),
    ...dateFilters(query, req.t),
  }),
});
