import { StaySdkProvider } from '@stay/sdk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { getStaySdk, readSession, subscribeSession } from './session';

/** React Query + `StaySdkProvider`; the cache is dropped whenever the signed-in user changes. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 2 * 60_000,
          },
        },
      }),
  );

  useEffect(() => {
    let previous = readSession().user?.id;

    return subscribeSession(() => {
      const next = readSession().user?.id;

      if (next !== previous) {
        previous = next;
        client.clear();
      }
    });
  }, [client]);

  return (
    <QueryClientProvider client={client}>
      <StaySdkProvider sdk={getStaySdk()}>{children}</StaySdkProvider>
    </QueryClientProvider>
  );
}
