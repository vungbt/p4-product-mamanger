'use client';

import {
  mutationOptions,
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createContext, type ReactNode, useContext } from 'react';
import { createPortalApi, isPortalSessionError } from '../portal/index.js';
import type { StaySdk } from '../shared/client.js';
import { ApiSdkError } from '../shared/errors.js';

/** The tenant portal client (`createPortalSdk`), apart from the staff `StaySdkProvider`. */
const PortalContext = createContext<StaySdk | null>(null);

export function PortalSdkProvider({ sdk, children }: { sdk: StaySdk; children: ReactNode }) {
  return <PortalContext.Provider value={sdk}>{children}</PortalContext.Provider>;
}

export function usePortalSdk() {
  const sdk = useContext(PortalContext);

  if (!sdk) throw new Error('usePortalSdk requires PortalSdkProvider.');
  return sdk;
}

/** Portal data is cached apart from the staff cache (`['stay', …]`). */
export const portalKeys = {
  all: ['stay-portal'] as const,
  lookup: (token: string) => ['stay-portal', 'lookup', token] as const,
  me: () => ['stay-portal', 'me'] as const,
  invoices: () => ['stay-portal', 'invoices'] as const,
  invoice: (id: string) => ['stay-portal', 'invoice', id] as const,
  contract: () => ['stay-portal', 'contract'] as const,
  usage: () => ['stay-portal', 'usage'] as const,
  notices: () => ['stay-portal', 'notices'] as const,
};

/** 401 (no session), 404 (invalid link/invoice) and 429 cannot succeed on retry. */
function retryPortal(failureCount: number, error: unknown) {
  if (error instanceof ApiSdkError && [401, 403, 404, 429].includes(error.status)) return false;
  return failureCount < 1;
}

export function portalQueryOptions(sdk: StaySdk) {
  const api = createPortalApi(sdk);
  const base = { retry: retryPortal, staleTime: 30_000 };

  return {
    lookup: (token: string) =>
      queryOptions({
        ...base,
        queryKey: portalKeys.lookup(token),
        queryFn: () => api.lookup(token),
        enabled: Boolean(token),
        staleTime: 0,
      }),
    me: () =>
      queryOptions({ ...base, queryKey: portalKeys.me(), queryFn: ({ signal }) => api.me(signal) }),
    invoices: () =>
      queryOptions({
        ...base,
        queryKey: portalKeys.invoices(),
        queryFn: ({ signal }) => api.invoices(signal),
      }),
    invoice: (id: string) =>
      queryOptions({
        ...base,
        queryKey: portalKeys.invoice(id),
        queryFn: ({ signal }) => api.invoice(id, signal),
        enabled: Boolean(id),
      }),
    contract: () =>
      queryOptions({
        ...base,
        queryKey: portalKeys.contract(),
        queryFn: ({ signal }) => api.contract(signal),
      }),
    usage: () =>
      queryOptions({
        ...base,
        queryKey: portalKeys.usage(),
        queryFn: ({ signal }) => api.usage(signal),
      }),
    notices: () =>
      queryOptions({
        ...base,
        queryKey: portalKeys.notices(),
        queryFn: ({ signal }) => api.notices(signal),
      }),
  };
}

export function portalMutationOptions(sdk: StaySdk, client: QueryClient) {
  const api = createPortalApi(sdk);
  /** A new or ended session invalidates every cached portal answer. */
  const reset = () => client.removeQueries({ queryKey: portalKeys.all });

  return {
    signIn: () => mutationOptions({ mutationFn: api.signIn, retry: false, onSuccess: reset }),
    signOut: () =>
      mutationOptions({
        mutationFn: api.signOut,
        retry: false,
        onSettled: reset,
      }),
  };
}

export function usePortalLookup(token: string) {
  return useQuery(portalQueryOptions(usePortalSdk()).lookup(token));
}

export function usePortalMe() {
  return useQuery(portalQueryOptions(usePortalSdk()).me());
}

export function usePortalInvoices() {
  return useQuery(portalQueryOptions(usePortalSdk()).invoices());
}

export function usePortalInvoice(id: string) {
  return useQuery(portalQueryOptions(usePortalSdk()).invoice(id));
}

export function usePortalContract() {
  return useQuery(portalQueryOptions(usePortalSdk()).contract());
}

export function usePortalUsage() {
  return useQuery(portalQueryOptions(usePortalSdk()).usage());
}

export function usePortalNotices() {
  return useQuery(portalQueryOptions(usePortalSdk()).notices());
}

export function usePortalSignIn() {
  return useMutation(portalMutationOptions(usePortalSdk(), useQueryClient()).signIn());
}

export function usePortalSignOut() {
  return useMutation(portalMutationOptions(usePortalSdk(), useQueryClient()).signOut());
}

export { isPortalSessionError };
