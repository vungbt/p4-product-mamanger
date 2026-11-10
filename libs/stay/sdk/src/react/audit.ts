import { queryOptions, useQuery } from '@tanstack/react-query';
import { type AuditListQuery, createAuditApi } from '../shared/audit.js';
import type { StaySdk } from '../shared/client.js';
import { useStaySdk } from './provider.js';

export const auditKeys = {
  all: ['stay', 'audit'] as const,
  lists: () => ['stay', 'audit', 'list'] as const,
  list: (query?: AuditListQuery) => ['stay', 'audit', 'list', query ?? {}] as const,
  detail: (id: string) => ['stay', 'audit', 'detail', id] as const,
};

export function auditQueryOptions(sdk: StaySdk) {
  const api = createAuditApi(sdk);

  return {
    list: (query?: AuditListQuery) =>
      queryOptions({
        queryKey: auditKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: auditKeys.detail(id),
        queryFn: ({ signal }) => api.detail(id, signal),
        enabled: Boolean(id),
      }),
  };
}

export function useAuditLogs(query?: AuditListQuery) {
  const sdk = useStaySdk();

  return useQuery(auditQueryOptions(sdk).list(query));
}

export function useAuditLog(id: string) {
  const sdk = useStaySdk();

  return useQuery(auditQueryOptions(sdk).detail(id));
}
