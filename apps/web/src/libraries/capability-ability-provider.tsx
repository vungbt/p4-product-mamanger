import { AbilityProvider } from '@p4/ability/browser';
import { useCapabilities } from '@p4/api-sdk/react';
import type { ReactNode } from 'react';
import useAuth from '@/hooks/use-auth';

/** Exposes the signed-in user's CASL rules from `GET /api/me/capabilities`. */
export default function CapabilityAbilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const capabilities = useCapabilities(user?.id);

  const rules = capabilities.isError ? undefined : capabilities.data?.data.rules;

  return <AbilityProvider rules={rules}>{children}</AbilityProvider>;
}
