import type { StayAbilityUser, StayRole, StayRule } from './ability.js';

/** The signed-in user as the API returns it (`GET /api/me`) and stores on the request. */
export interface StayUser extends StayAbilityUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  role: StayRole;
  /** Assigned buildings (managers); empty for owners, who see every building. */
  buildingIds: string[];
  /** Contracts the user occupies (tenants). */
  contractIds: string[];
}

/** `GET /api/me`. */
export interface StayMe {
  user: StayUser;
}

/** `GET /api/me/capabilities`: CASL rules of the signed-in user for `stayAbilityKit`. */
export interface StayCapabilities {
  contractVersion: string;
  rules: StayRule[];
}
