'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { StaySdk } from '../shared/client.js';

const Context = createContext<StaySdk | null>(null);

export function StaySdkProvider({ sdk, children }: { sdk: StaySdk; children: ReactNode }) {
  return <Context.Provider value={sdk}>{children}</Context.Provider>;
}

export function useStaySdk() {
  const sdk = useContext(Context);

  if (!sdk) throw new Error('useStaySdk requires StaySdkProvider.');
  return sdk;
}
