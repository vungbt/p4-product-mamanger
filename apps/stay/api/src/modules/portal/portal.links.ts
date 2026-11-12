import { randomBytes } from 'node:crypto';
import { BaseError, NotFound } from '@p4/server-core';
import {
  portalLinkPath,
  type StayUser,
  type TenantPortalLink,
  type TenantPortalLinkCreated,
  type TenantPortalLinkRevokeResult,
} from '@stay/shared';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import {
  sequelize,
  TenantModel,
  TenantPortalLinkModel,
  TenantPortalSessionModel,
  UserModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { findContract } from '../contracts/contracts.service.js';
import { conflict } from '../invoices/invoices.service.js';
import { webOrigin } from '../invoices/invoices.share.js';
import {
  contractContext,
  type LinkContext,
  linkStatus,
  portalOpen,
  sha256,
} from './portal.access.js';

/** Unexpired portal sessions per link. */
async function sessionCounts(linkIds: string[], transaction?: Transaction) {
  if (!linkIds.length) return new Map<string, number>();
  const rows = await sequelize.query<{ linkId: string; count: number }>(
    `SELECT link_id AS "linkId", count(*)::int AS count FROM tenant_portal_sessions
     WHERE link_id IN (:linkIds) AND expires_at > now() GROUP BY link_id`,
    { replacements: { linkIds }, type: QueryTypes.SELECT, transaction },
  );

  return new Map(rows.map((row) => [row.linkId, row.count]));
}

async function linkDtos(
  context: LinkContext,
  rows: TenantPortalLinkModel[],
  transaction?: Transaction,
): Promise<TenantPortalLink[]> {
  const [tenants, users, sessions] = await Promise.all([
    TenantModel.findAll({
      where: { id: { [Op.in]: [...new Set(rows.map((row) => row.tenantId))] } },
      attributes: ['id', 'fullName'],
      transaction,
    }),
    UserModel.findAll({
      where: {
        id: {
          [Op.in]: [...new Set(rows.flatMap((row) => (row.createdBy ? [row.createdBy] : [])))],
        },
      },
      attributes: ['id', 'displayName'],
      transaction,
    }),
    sessionCounts(
      rows.map((row) => row.id),
      transaction,
    ),
  ]);
  const names = new Map(tenants.map((tenant) => [tenant.id, tenant.fullName]));
  const creators = new Map(users.map((user) => [user.id, user.displayName]));

  return rows.map((row) => ({
    id: row.id,
    contractId: row.contractId,
    tenantId: row.tenantId,
    tenantName: names.get(row.tenantId) ?? '',
    status: linkStatus(row, context),
    lastOpenedAt: row.lastOpenedAt?.toISOString() ?? null,
    lockedUntil:
      row.lockedUntil && row.lockedUntil > new Date() ? row.lockedUntil.toISOString() : null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    activeSessions: row.revokedAt ? 0 : (sessions.get(row.id) ?? 0),
    createdByName: (row.createdBy && creators.get(row.createdBy)) ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

/** Revokes a link and signs out every device that used it; returns the sessions removed. */
async function revokeRow(row: TenantPortalLinkModel, user: StayUser, transaction: Transaction) {
  if (!row.revokedAt) {
    row.set({ revokedAt: new Date(), revokedBy: user.id });
    await row.save({ transaction });
  }
  return TenantPortalSessionModel.destroy({ where: { linkId: row.id }, transaction });
}

/** `GET /api/contracts/:id/portal-links`: every link of the contract, newest first. */
export async function listPortalLinks(
  user: StayUser,
  contractId: string,
): Promise<TenantPortalLink[]> {
  const contract = await findContract(user, contractId, 'read');
  const context = await contractContext(contract.id);
  const rows = await TenantPortalLinkModel.findAll({
    where: { contractId: contract.id, accountUserId: null },
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  return context ? linkDtos(context, rows) : [];
}

/**
 * `POST /api/contracts/:id/portal-links` `{ tenantId }`: a new link for a current occupant of an
 * active/ending contract. The random token (32 bytes) is returned once; only its SHA-256 hash is
 * stored. The occupant's previous active link is revoked and its devices signed out.
 */
export async function createPortalLink(
  user: StayUser,
  contractId: string,
  tenantId: string,
  requestOrigin: string | undefined,
): Promise<TenantPortalLinkCreated> {
  return auditedTransaction(async (transaction) => {
    // Locks the contract row: concurrent creations for one contract are serialized.
    const contract = await findContract(user, contractId, 'update', transaction);

    if (!['active', 'ending'].includes(contract.status)) conflict('contract_not_active');
    const context = await contractContext(contract.id, transaction);

    if (!context || !portalOpen(contract, context.occupants, tenantId))
      throw new BaseError('portal_tenant_not_occupant', 422, 'portal_tenant_not_occupant');
    const previous = await TenantPortalLinkModel.findOne({
      where: { contractId: contract.id, tenantId, revokedAt: null, accountUserId: null },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
    const sessionsRevoked = previous ? await revokeRow(previous, user, transaction) : 0;
    const token = randomBytes(32).toString('base64url');
    const row = await TenantPortalLinkModel.create(
      {
        buildingId: contract.buildingId,
        contractId: contract.id,
        tenantId,
        tokenHash: sha256(token),
        createdBy: user.id,
      },
      { transaction },
    );

    // Ids only: never the token, its hash or the occupant's name/phone.
    await recordAudit(
      {
        action: 'tenant_portal_link.created',
        resourceType: 'tenant_portal_link',
        resourceId: row.id,
        changes: {
          buildingId: contract.buildingId,
          contractId: contract.id,
          tenantId,
          linkId: row.id,
          replacedLinkId: previous?.id ?? null,
          sessionsRevoked,
        },
      },
      transaction,
    );
    const [link] = await linkDtos(context, [row], transaction);
    const path = portalLinkPath(token);

    if (!link) throw new NotFound();
    return {
      link,
      token,
      path,
      url: `${webOrigin(requestOrigin)}${path}`,
      replacedLinkId: previous?.id ?? null,
    };
  });
}

/**
 * `DELETE /api/portal-links/:id` (idempotent): revokes the link and deletes every portal session
 * of it, so each device that opened it is signed out. Inaccessible links are 404.
 */
export async function revokePortalLink(
  user: StayUser,
  id: string,
): Promise<TenantPortalLinkRevokeResult> {
  return auditedTransaction(async (transaction) => {
    const row = await TenantPortalLinkModel.findByPk(id, {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (
      !row ||
      !canAccessRecord(user, 'update', 'Contract', {
        buildingId: row.buildingId,
        contractId: row.contractId,
      })
    )
      throw new NotFound('portal_link_not_found');
    const revoked = !row.revokedAt;
    const sessionsRevoked = await revokeRow(row, user, transaction);
    const context = await contractContext(row.contractId, transaction);

    await recordAudit(
      {
        action: 'tenant_portal_link.revoked',
        resourceType: 'tenant_portal_link',
        resourceId: row.id,
        changes: {
          buildingId: row.buildingId,
          contractId: row.contractId,
          tenantId: row.tenantId,
          linkId: row.id,
          revoked,
          sessionsRevoked,
        },
      },
      transaction,
    );
    if (!context) throw new NotFound('portal_link_not_found');
    const [link] = await linkDtos(context, [row], transaction);

    if (!link) throw new NotFound('portal_link_not_found');
    return { link, revoked, sessionsRevoked };
  });
}
