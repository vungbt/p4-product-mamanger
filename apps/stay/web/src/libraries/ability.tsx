import { createAbilityReact } from '@p4/ability/browser';
import { useCapabilities } from '@stay/sdk/react';
import { type StayAbility, type StayAction, type StaySubject, stayAbilityKit } from '@stay/shared';
import type { ReactNode } from 'react';
import { useAuth } from '@/libraries/session/auth-provider';

/** Stay bindings of the shared CASL React helpers (one provider at the root). */
export const { AbilityProvider, useAbility, useCanAccess, useCanAccessSome, Can } =
  createAbilityReact(stayAbilityKit);

/** Access a route needs; also filters the menus built from routes. */
export type AbilityCheck = { action: StayAction; subject: StaySubject };

/** Owner-wide areas: opening them needs access to every record (`canAccess`). */
const WHOLE_AREA_SUBJECTS: readonly StaySubject[] = ['Settings', 'Member'];

/**
 * Whether a page or menu item opens. Building-scoped subjects open with access to at least one
 * record (a manager's `{ buildingId: { $in } }` rules); the API filters their data per building.
 * Settings and Member need unconditional access.
 */
export function canOpen(ability: StayAbility, { action, subject }: AbilityCheck): boolean {
  return WHOLE_AREA_SUBJECTS.includes(subject)
    ? stayAbilityKit.canAccess(ability, action, subject)
    : stayAbilityKit.canAccessSome(ability, action, subject);
}

export function useCanOpen(check: AbilityCheck): boolean {
  return canOpen(useAbility(), check);
}

/** Feeds the signed-in user's rules from `GET /api/me/capabilities` (refreshed by the SDK). */
export function CapabilityAbilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const capabilities = useCapabilities(user?.id);

  // A failed background refetch keeps the last rules; signing out drops them.
  const rules = user ? capabilities.data?.rules : undefined;

  return <AbilityProvider rules={rules}>{children}</AbilityProvider>;
}
