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
import { createPaymentApi, type PaymentListQuery } from '../shared/payments.js';
import { useStaySdk } from './provider.js';

export const paymentKeys = {
  all: ['stay', 'payments'] as const,
  list: (query?: PaymentListQuery) => ['stay', 'payments', 'list', query ?? {}] as const,
};

export function paymentQueryOptions(sdk: StaySdk) {
  const api = createPaymentApi(sdk);

  return {
    list: (query?: PaymentListQuery) =>
      queryOptions({
        queryKey: paymentKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
        placeholderData: keepPreviousData,
      }),
  };
}

export function paymentMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createPaymentApi(sdk);
  /**
   * A payment changes the invoice (paid total, status), receivables, room debts, contracts and
   * the overview.
   */
  const refresh = () =>
    Promise.all(
      ['payments', 'invoices', 'receivables', 'rooms', 'contracts', 'overview', 'reports'].map(
        (area) => client.invalidateQueries({ queryKey: ['stay', area] }),
      ),
    );

  return {
    create: () => mutationOptions({ mutationFn: api.create, retry: false, onSuccess: refresh }),
    reverse: () => mutationOptions({ mutationFn: api.reverse, retry: false, onSuccess: refresh }),
  };
}

export function usePayments(query?: PaymentListQuery) {
  return useQuery(paymentQueryOptions(useStaySdk()).list(query));
}

export function useRecordPayment() {
  return useMutation(paymentMutationOptions(useStaySdk(), useQueryClient()).create());
}

export function useReversePayment() {
  return useMutation(paymentMutationOptions(useStaySdk(), useQueryClient()).reverse());
}
