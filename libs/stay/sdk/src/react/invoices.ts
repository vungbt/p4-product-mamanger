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
import { createInvoiceApi, type InvoiceListQuery } from '../shared/invoices.js';
import { useStaySdk } from './provider.js';

export const invoiceKeys = {
  all: ['stay', 'invoices'] as const,
  list: (query?: InvoiceListQuery) => ['stay', 'invoices', 'list', query ?? {}] as const,
  detail: (id: string) => ['stay', 'invoices', 'detail', id] as const,
  preview: (buildingId: string, period: string) =>
    ['stay', 'invoices', 'preview', buildingId, period] as const,
  /** Public invoice of a share token (ST-16), cached apart from the signed-in user's data. */
  public: (token: string) => ['stay', 'public-invoice', token] as const,
};

export function invoiceQueryOptions(sdk: StaySdk) {
  const api = createInvoiceApi(sdk);

  return {
    list: (query?: InvoiceListQuery) =>
      queryOptions({
        queryKey: invoiceKeys.list(query),
        queryFn: ({ signal }) => api.list(query, signal),
        placeholderData: keepPreviousData,
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: invoiceKeys.detail(id),
        queryFn: ({ signal }) => api.detail(id, signal),
        enabled: Boolean(id),
      }),
    preview: (buildingId: string, period: string) =>
      queryOptions({
        queryKey: invoiceKeys.preview(buildingId, period),
        queryFn: ({ signal }) => api.preview(buildingId, period, signal),
        enabled: Boolean(buildingId && period),
        staleTime: 0,
      }),
    publicInvoice: (token: string) =>
      queryOptions({
        queryKey: invoiceKeys.public(token),
        queryFn: ({ signal }) => api.publicInvoice(token, signal),
        enabled: Boolean(token),
        staleTime: 30_000,
        // Unknown/expired/revoked links are 404: retrying cannot help.
        retry: false,
      }),
  };
}

export function invoiceMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createInvoiceApi(sdk);
  /**
   * Invoices change receivables, room debts/recent invoices and the overview; issue and void
   * lock/unlock readings.
   */
  const refresh = (areas: string[]) => () =>
    Promise.all(
      ['invoices', 'receivables', 'rooms', 'overview', 'reports', ...areas].map((area) =>
        client.invalidateQueries({ queryKey: ['stay', area] }),
      ),
    );

  return {
    createDrafts: () =>
      mutationOptions({ mutationFn: api.createDrafts, retry: false, onSuccess: refresh([]) }),
    addLine: () =>
      mutationOptions({ mutationFn: api.addLine, retry: false, onSuccess: refresh([]) }),
    deleteLine: () =>
      mutationOptions({ mutationFn: api.deleteLine, retry: false, onSuccess: refresh([]) }),
    issue: () =>
      mutationOptions({
        mutationFn: api.issue,
        retry: false,
        onSuccess: refresh(['readings', 'buildings', 'contracts']),
      }),
    void: () =>
      mutationOptions({
        mutationFn: api.void,
        retry: false,
        onSuccess: refresh(['readings', 'contracts']),
      }),
    share: () => mutationOptions({ mutationFn: api.share, retry: false, onSuccess: refresh([]) }),
    revokeShare: () =>
      mutationOptions({ mutationFn: api.revokeShare, retry: false, onSuccess: refresh([]) }),
    sharePeriod: () =>
      mutationOptions({ mutationFn: api.sharePeriod, retry: false, onSuccess: refresh([]) }),
    createMoveIn: () =>
      mutationOptions({
        mutationFn: api.createMoveIn,
        retry: false,
        onSuccess: refresh(['contracts']),
      }),
  };
}

export function useInvoices(query?: InvoiceListQuery) {
  return useQuery(invoiceQueryOptions(useStaySdk()).list(query));
}

export function useInvoice(id: string) {
  return useQuery(invoiceQueryOptions(useStaySdk()).detail(id));
}

export function useBillingPreview(buildingId: string, period: string) {
  return useQuery(invoiceQueryOptions(useStaySdk()).preview(buildingId, period));
}

export function useCreateInvoiceDrafts() {
  return useMutation(invoiceMutationOptions(useStaySdk(), useQueryClient()).createDrafts());
}

export function useAddInvoiceLine() {
  return useMutation(invoiceMutationOptions(useStaySdk(), useQueryClient()).addLine());
}

export function useDeleteInvoiceLine() {
  return useMutation(invoiceMutationOptions(useStaySdk(), useQueryClient()).deleteLine());
}

export function useIssueInvoices() {
  return useMutation(invoiceMutationOptions(useStaySdk(), useQueryClient()).issue());
}

export function useVoidInvoice() {
  return useMutation(invoiceMutationOptions(useStaySdk(), useQueryClient()).void());
}

export function useCreateMoveInInvoice() {
  return useMutation(invoiceMutationOptions(useStaySdk(), useQueryClient()).createMoveIn());
}

export function usePublicInvoice(token: string) {
  return useQuery(invoiceQueryOptions(useStaySdk()).publicInvoice(token));
}

export function useShareInvoice() {
  return useMutation(invoiceMutationOptions(useStaySdk(), useQueryClient()).share());
}

export function useRevokeInvoiceShare() {
  return useMutation(invoiceMutationOptions(useStaySdk(), useQueryClient()).revokeShare());
}

export function useSharePeriodInvoices() {
  return useMutation(invoiceMutationOptions(useStaySdk(), useQueryClient()).sharePeriod());
}
