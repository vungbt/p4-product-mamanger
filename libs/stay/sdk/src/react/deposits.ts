import {
  keepPreviousData,
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { StaySdk } from '../shared/client.js';
import { createDepositApi, type DepositListQuery } from '../shared/deposits.js';
import { useStaySdk } from './provider.js';

export const depositKeys = {
  all: ['stay', 'deposits'] as const,
  list: (query?: DepositListQuery) => ['stay', 'deposits', 'list', query ?? {}] as const,
  ledger: (id: string) => ['stay', 'deposits', 'ledger', id] as const,
};

export function depositQueryOptions(sdk: StaySdk) {
  const api = createDepositApi(sdk);

  return {
    list: (query?: DepositListQuery) =>
      queryOptions({
        queryKey: depositKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
        placeholderData: keepPreviousData,
      }),
    ledger: (id: string) =>
      queryOptions({
        queryKey: depositKeys.ledger(id),
        queryFn: ({ signal }) => api.ledger(id, signal),
        enabled: Boolean(id),
      }),
  };
}

export function depositMutationOptions(sdk: StaySdk, client: QueryClient) {
  return {
    create: () =>
      mutationOptions({
        mutationFn: createDepositApi(sdk).create,
        retry: false,
        onSuccess: () =>
          Promise.all(
            ['deposits', 'contracts', 'rooms'].map((area) =>
              client.invalidateQueries({ queryKey: ['stay', area] }),
            ),
          ),
      }),
  };
}

export function useDeposits(query?: DepositListQuery) {
  return useQuery(depositQueryOptions(useStaySdk()).list(query));
}

export function useDepositLedger(id: string) {
  return useQuery(depositQueryOptions(useStaySdk()).ledger(id));
}

export function useCreateDeposit() {
  return useMutation(depositMutationOptions(useStaySdk(), useQueryClient()).create());
}
