import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { createOverviewApi } from '../shared/overview.js';
import { useStaySdk } from './provider.js';

/**
 * Invoice, payment, reading and contract mutations invalidate `overviewKeys.all` (see
 * `invoices.ts`, `payments.ts`, `readings.ts` and `contracts.ts`), so Tổng quan stays current.
 */
export const overviewKeys = {
  all: ['stay', 'overview'] as const,
  detail: (buildingId: string, period?: string) =>
    ['stay', 'overview', buildingId, period ?? 'current'] as const,
};

export function overviewQueryOptions(sdk: StaySdk) {
  const api = createOverviewApi(sdk);

  return {
    detail: (buildingId: string, period?: string) =>
      queryOptions({
        queryKey: overviewKeys.detail(buildingId, period),
        queryFn: ({ signal }) => api.get(buildingId, period, signal),
        enabled: Boolean(buildingId),
        placeholderData: keepPreviousData,
      }),
  };
}

export function useBuildingOverview(buildingId: string, period?: string) {
  return useQuery(overviewQueryOptions(useStaySdk()).detail(buildingId, period));
}
