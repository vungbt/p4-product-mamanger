import { queryOptions, useQuery } from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { createReportsApi, type ReportRange } from '../shared/reports.js';
import { useStaySdk } from './provider.js';

export const reportKeys = {
  all: ['stay', 'reports'] as const,
  revenue: (range: ReportRange) => ['stay', 'reports', 'revenue', range] as const,
  rooms: (buildingId: string, year: number) =>
    ['stay', 'reports', 'rooms', buildingId, year] as const,
  utilities: (range: ReportRange) => ['stay', 'reports', 'utilities', range] as const,
};

export function reportQueryOptions(sdk: StaySdk) {
  const api = createReportsApi(sdk);

  return {
    revenue: (range: ReportRange) =>
      queryOptions({
        queryKey: reportKeys.revenue(range),
        queryFn: ({ signal }) => api.revenue(range, signal),
        enabled: Boolean(range.buildingId),
      }),
    rooms: (buildingId: string, year: number) =>
      queryOptions({
        queryKey: reportKeys.rooms(buildingId, year),
        queryFn: ({ signal }) => api.rooms({ buildingId, year }, signal),
        enabled: Boolean(buildingId),
      }),
    utilities: (range: ReportRange) =>
      queryOptions({
        queryKey: reportKeys.utilities(range),
        queryFn: ({ signal }) => api.utilities(range, signal),
        enabled: Boolean(range.buildingId),
      }),
  };
}

export function useRevenueReport(range: ReportRange) {
  return useQuery(reportQueryOptions(useStaySdk()).revenue(range));
}

export function useRoomsReport(buildingId: string, year: number) {
  return useQuery(reportQueryOptions(useStaySdk()).rooms(buildingId, year));
}

export function useUtilitiesReport(range: ReportRange) {
  return useQuery(reportQueryOptions(useStaySdk()).utilities(range));
}
