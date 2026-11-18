import type { ManagerPermissionGroup, StayAccountStatus } from './ability.js';

export interface MemberInput {
  buildingIds: string[];
  permissionGroups: ManagerPermissionGroup[];
}

export interface MemberInvitationInput extends MemberInput {
  email: string;
}

export interface StayMember extends MemberInvitationInput {
  id: string;
  displayName: string;
  accountStatus: StayAccountStatus;
  buildingNames: string[];
  version: number;
}
