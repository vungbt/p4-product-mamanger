import { useQuery } from '@tanstack/react-query';
import { ApiSdkError, unwrap } from '../shared/errors.js';
import { useStaySdk } from './provider.js';

const noRetryOnAuth = (attempt: number, error: unknown) =>
  !(error instanceof ApiSdkError && [401, 403].includes(error.status)) && attempt < 1;

export const meKeys = {
  me: (accountId: string | undefined) => ['stay', 'me', accountId] as const,
  capabilities: (accountId: string | undefined) => ['stay', 'capabilities', accountId] as const,
};

/** `GET /api/me` for the signed-in account (pass the Better Auth session user id). */
export function useMe(accountId: string | undefined) {
  const sdk = useStaySdk();

  return useQuery({
    queryKey: meKeys.me(accountId),
    enabled: Boolean(accountId),
    queryFn: async ({ signal }) => unwrap(await sdk.GET('/api/me', { signal })).data,
    retry: noRetryOnAuth,
  });
}

/** CASL rules for `stayAbilityKit` (`GET /api/me/capabilities`), refreshed every 30 s. */
export function useCapabilities(accountId: string | undefined) {
  const sdk = useStaySdk();

  return useQuery({
    queryKey: meKeys.capabilities(accountId),
    enabled: Boolean(accountId),
    queryFn: async ({ signal }) => unwrap(await sdk.GET('/api/me/capabilities', { signal })).data,
    staleTime: 30_000,
    refetchOnWindowFocus: 'always',
    refetchInterval: 30_000,
    retry: noRetryOnAuth,
  });
}
