import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { createReceivableApi, type ReceivableListQuery } from '../shared/receivables.js';
import { useStaySdk } from './provider.js';

/**
 * Invoice, payment and share mutations invalidate `receivableKeys.all` (see `invoices.ts` and
 * `payments.ts`), so a row updates or disappears right after a payment.
 */
export const receivableKeys = {
  all: ['stay', 'receivables'] as const,
  list: (buildingId: string, query?: ReceivableListQuery) =>
    ['stay', 'receivables', 'list', buildingId, query ?? {}] as const,
};

export function receivableQueryOptions(sdk: StaySdk) {
  const api = createReceivableApi(sdk);

  return {
    list: (buildingId: string, query?: ReceivableListQuery) =>
      queryOptions({
        queryKey: receivableKeys.list(buildingId, query),
        queryFn: ({ signal }) => api.list(buildingId, query, signal),
        enabled: Boolean(buildingId),
        placeholderData: keepPreviousData,
      }),
  };
}

export function useReceivables(buildingId: string, query?: ReceivableListQuery) {
  return useQuery(receivableQueryOptions(useStaySdk()).list(buildingId, query));
}
