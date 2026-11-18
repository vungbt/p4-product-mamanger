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
import { createRequestInboxApi, type InboxListQuery } from '../shared/requests.js';
import { useStaySdk } from './provider.js';

export const requestInboxKeys = {
  all: ['stay', 'requests'] as const,
  list: (query?: InboxListQuery) => ['stay', 'requests', 'list', query ?? {}] as const,
};

export function requestInboxQueryOptions(sdk: StaySdk) {
  const api = createRequestInboxApi(sdk);

  return {
    list: (query?: InboxListQuery, options: { enabled?: boolean } = {}) =>
      queryOptions({
        queryKey: requestInboxKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
        placeholderData: keepPreviousData,
        enabled: options.enabled ?? true,
      }),
  };
}

export function requestInboxMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createRequestInboxApi(sdk);
  /** Accepting may change the contract (occupants, vehicles, notice); a claim the ledger. */
  const refresh = () =>
    Promise.all(
      [
        'requests',
        'contracts',
        'tenants',
        'rooms',
        'invoices',
        'payments',
        'receivables',
        'overview',
        'reports',
      ].map((area) => client.invalidateQueries({ queryKey: ['stay', area] })),
    );

  return {
    accept: () => mutationOptions({ mutationFn: api.accept, retry: false, onSuccess: refresh }),
    reject: () => mutationOptions({ mutationFn: api.reject, retry: false, onSuccess: refresh }),
    reply: () => mutationOptions({ mutationFn: api.reply, retry: false, onSuccess: refresh }),
    confirmClaim: () =>
      mutationOptions({ mutationFn: api.confirmClaim, retry: false, onSuccess: refresh }),
    rejectClaim: () =>
      mutationOptions({ mutationFn: api.rejectClaim, retry: false, onSuccess: refresh }),
  };
}

export function useRequestInbox(query?: InboxListQuery, options?: { enabled?: boolean }) {
  return useQuery(requestInboxQueryOptions(useStaySdk()).list(query, options));
}

function useInboxMutations() {
  return requestInboxMutationOptions(useStaySdk(), useQueryClient());
}

export function useAcceptRequest() {
  return useMutation(useInboxMutations().accept());
}
export function useRejectRequest() {
  return useMutation(useInboxMutations().reject());
}
export function useReplyRequest() {
  return useMutation(useInboxMutations().reply());
}
export function useConfirmPaymentClaim() {
  return useMutation(useInboxMutations().confirmClaim());
}
export function useRejectPaymentClaim() {
  return useMutation(useInboxMutations().rejectClaim());
}
