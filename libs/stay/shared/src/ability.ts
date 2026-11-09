import {
  ANY_ACTION,
  ANY_SUBJECT,
  createAbilityKit,
  type KitAbility,
  type KitRule,
} from '@p4/ability/core';

/** `users.role`: `owner` manages everything, `manager` assigned buildings, `tenant` own contracts. */
export const STAY_ROLES = ['owner', 'manager', 'tenant'] as const;
export type StayRole = (typeof STAY_ROLES)[number];

/** `users.account_status`; only `active` accounts can sign in. */
export const STAY_ACCOUNT_STATUSES = ['active', 'blocked'] as const;
export type StayAccountStatus = (typeof STAY_ACCOUNT_STATUSES)[number];

/** `building_members.role`: per-building assignments (owners need no row). */
export const BUILDING_MEMBER_ROLES = ['manager'] as const;
export type BuildingMemberRole = (typeof BUILDING_MEMBER_ROLES)[number];

export const STAY_ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'manage',
  'issue',
  'void',
  'settle',
] as const;
export type StayAction = (typeof STAY_ACTIONS)[number];

export const STAY_SUBJECTS = [
  'Building',
  'Room',
  'Tenant',
  'Contract',
  'Deposit',
  'MeterReading',
  'Invoice',
  'Payment',
  'Expense',
  'Maintenance',
  'Settings',
  'Report',
  'AuditLog',
  'Member',
] as const;
export type StaySubject = (typeof STAY_SUBJECTS)[number];

/**
 * Record attributes matched by conditional rules. Pass the record's own id for its subject:
 * a building is `{ buildingId: building.id }`, a contract `{ buildingId, contractId: contract.id }`.
 */
export interface StayRecord {
  buildingId?: string;
  contractId?: string;
}

/** What the ability needs to know about the signed-in user. */
export interface StayAbilityUser {
  id: string;
  role: StayRole;
  /** Buildings a manager is assigned to (`building_members`). */
  buildingIds?: readonly string[];
  /** Contracts a tenant occupies. */
  contractIds?: readonly string[];
}

export type StayAbility = KitAbility<StayAction, StaySubject, StayRecord>;
export type StayRule = KitRule<StayAction, StaySubject>;

/** Day-to-day subjects a manager handles inside assigned buildings. */
const MANAGER_SUBJECTS: StaySubject[] = [
  'Room',
  'Tenant',
  'Contract',
  'Deposit',
  'MeterReading',
  'Invoice',
  'Payment',
  'Expense',
  'Maintenance',
];

export const stayAbilityKit = createAbilityKit<
  StayAction,
  StaySubject,
  StayAbilityUser,
  StayRecord
>({
  actions: STAY_ACTIONS,
  subjects: STAY_SUBJECTS,
  define({ can }, user) {
    if (user.role === 'owner') {
      can(ANY_ACTION, ANY_SUBJECT);
      return;
    }

    if (user.role === 'manager') {
      // Settings, Member, `void` and `settle` stay with the owner.
      const assigned = { buildingId: { $in: [...(user.buildingIds ?? [])] } };

      can(['read', 'update'], 'Building', assigned);
      can(['read', 'create', 'update', 'delete'], MANAGER_SUBJECTS, assigned);
      can('issue', 'Invoice', assigned);
      can('read', ['Report', 'AuditLog'], assigned);
      return;
    }

    const own = { contractId: { $in: [...(user.contractIds ?? [])] } };

    can('read', ['Contract', 'Invoice', 'MeterReading'], own);
    can('create', 'Maintenance', own);
  },
  recordAttributes: ({ buildingId, contractId }) => ({ buildingId, contractId }),
});

export function isStayRole(value: unknown): value is StayRole {
  return (STAY_ROLES as readonly unknown[]).includes(value);
}
