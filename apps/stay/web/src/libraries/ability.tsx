import { createAbilityReact } from '@p4/ability/browser';
import { useCapabilities } from '@stay/sdk/react';
import { type StayAction, type StaySubject, stayAbilityKit } from '@stay/shared';
import type { ReactNode } from 'react';
import { useAuth } from '@/libraries/session/auth-provider';

/** Stay bindings of the shared CASL React helpers (one provider at the root). */
export const { AbilityProvider, useAbility, useCanAccess, Can } =
  createAbilityReact(stayAbilityKit);

/** Unconditional access a route needs; also filters the menus built from routes. */
export type AbilityCheck = { action: StayAction; subject: StaySubject };

/** Feeds the signed-in user's rules from `GET /api/me/capabilities` (refreshed by the SDK). */
export function CapabilityAbilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const capabilities = useCapabilities(user?.id);

  // A failed background refetch keeps the last rules; signing out drops them.
  const rules = user ? capabilities.data?.rules : undefined;

  return <AbilityProvider rules={rules}>{children}</AbilityProvider>;
}
