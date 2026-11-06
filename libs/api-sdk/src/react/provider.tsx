'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { ApiSdk } from '../shared/client.js';

const Context = createContext<ApiSdk | null>(null);

export function ApiSdkProvider({ sdk, children }: { sdk: ApiSdk; children: ReactNode }) {
  return <Context.Provider value={sdk}>{children}</Context.Provider>;
}

export function useApiSdk() {
  const sdk = useContext(Context);
  if (!sdk) throw new Error('useApiSdk requires ApiSdkProvider.');
  return sdk;
}
