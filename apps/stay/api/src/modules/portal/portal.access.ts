import { createHash, timingSafeEqual } from 'node:crypto';
import {
  addDays,
  isoDateInTimeZone,
  PORTAL_ENDED_GRACE_DAYS,
  type PortalLinkStatus,
} from '@stay/shared';
import type { Transaction } from 'sequelize';
import {
  ContractModel,
  ContractOccupantModel,
  type TenantPortalLinkModel,
} from '@/sequelize/models/index.js';

/** Link tokens and session ids: 32 random bytes in base64url (always 43 characters). */
export const PORTAL_SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Only this hash of a link token or a session id is stored. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Constant-time comparison of two short secrets (hashed first: equal lengths). */
export function sameSecret(expected: string, given: string): boolean {
  return timingSafeEqual(
    createHash('sha256').update(expected).digest(),
    createHash('sha256').update(given).digest(),
  );
}

/** The last 4 digits of a stored phone number. */
export function phoneLast4(phone: string): string {
  return phone.replace(/\D/g, '').slice(-4);
}

export const todayVn = () => isoDateInTimeZone(new Date());

/** Business date the contract ended: move-out, else its end date, else when it was closed. */
function endedOn(contract: ContractModel): string {
  return contract.movedOutAt ?? contract.endDate ?? isoDateInTimeZone(contract.updatedAt);
}

/**
 * Date the portal reads the contract at: the end date of an ended contract (its occupants,
 * vehicles and services were closed the day after), the start date of a future contract, else
 * today.
 */
export function portalReferenceDate(contract: ContractModel, today = todayVn()): string {
  if (contract.status === 'ended') return endedOn(contract);
  return today < contract.startDate ? contract.startDate : today;
}

type OccupantRow = Pick<ContractOccupantModel, 'tenantId' | 'toDate'>;

/**
 * Whether an occupant's portal may be used (st-25.md): active/ending contracts while the person
 * still lives there (not removed); ended contracts for 30 days after the end; never drafts or
 * cancelled contracts.
 */
export function portalOpen(
  contract: ContractModel,
  occupants: readonly OccupantRow[],
  tenantId: string,
  today = todayVn(),
): boolean {
  if (!['active', 'ending', 'ended'].includes(contract.status)) return false;
  if (contract.status === 'ended' && today > addDays(endedOn(contract), PORTAL_ENDED_GRACE_DAYS))
    return false;
  const on = portalReferenceDate(contract, today);

  return occupants.some((row) => row.tenantId === tenantId && (!row.toDate || row.toDate > on));
}

export interface LinkContext {
  contract: ContractModel;
  occupants: ContractOccupantModel[];
}

export async function contractContext(
  contractId: string,
  transaction?: Transaction,
): Promise<LinkContext | null> {
  const contract = await ContractModel.findByPk(contractId, { transaction });

  if (!contract) return null;
  const occupants = await ContractOccupantModel.findAll({ where: { contractId }, transaction });

  return { contract, occupants };
}

export function linkStatus(
  link: TenantPortalLinkModel,
  context: LinkContext,
  now = new Date(),
): PortalLinkStatus {
  if (link.revokedAt) return 'revoked';
  if (!portalOpen(context.contract, context.occupants, link.tenantId)) return 'expired';
  if (link.lockedUntil && link.lockedUntil > now) return 'locked';
  return 'active';
}
