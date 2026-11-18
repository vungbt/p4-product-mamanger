import type { StayAbilityUser, StayUser } from '@stay/shared';

/** Tenant portal session (ST-25): one link of one occupant, scoped to one contract. */
export interface PortalPrincipal {
  sessionId: string;
  sessionExpiresAt: Date;
  linkId: string;
  buildingId: string;
  contractId: string;
  tenantId: string;
  /** CASL `tenant` role limited to `{ contractId }` (never a staff account). */
  ability: StayAbilityUser;
}

// `req.user`, `req.requestId` and `res.jsonApi` are declared by @p4/server-core.
declare global {
  namespace Express {
    interface User extends StayUser {}
    interface Request {
      /** Set by `portalSessionRequired` only; staff routes never read it. */
      portal?: PortalPrincipal;
    }
  }
}
