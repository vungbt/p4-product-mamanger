import {
  buildPaginationMeta,
  dateRange,
  listSearch,
  NotFound,
  redact,
  selectFields,
} from '@p4/server-core';
import type { JsonValue, ListQuery, PaginationMeta } from '@p4/shared';
import type { StayAuditLog, StayUser } from '@stay/shared';
import { Op, type WhereOptions } from 'sequelize';
import { hasAccess } from '@/middlewares/ability.middleware.js';
import { accessibleWhere } from '@/middlewares/accessible-where.js';
import type { AuditLogAttributes } from '@/sequelize/models/audit-log.model.js';
import { AuditLogModel, UserModel } from '@/sequelize/models/index.js';
import type { ModelOrder } from '@/types/database.js';

export interface AuditQuery extends ListQuery<'createdAt' | 'action' | 'resourceType'> {
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  buildingId?: string;
  from?: string;
  to?: string;
}

/** Additional Stay-specific fields, applied recursively after the shared redactor. */
function redactStay(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(redactStay);
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /cccd|cmnd|identity|identification|idnumber|nationalid|citizenid|personalid|passport|document|file|url|uri|apikey|cookie|session|bearer|privatekey|otp/i.test(
          key.replace(/[_\s-]/g, ''),
        )
          ? '[REDACTED]'
          : redactStay(item),
      ]),
    );
  if (typeof value === 'string' && /https?:\/\/|\b\d{9,12}\b/i.test(value)) return '[REDACTED]';
  return value;
}

function auditDto(row: AuditLogModel, actorName: string | null): StayAuditLog {
  return {
    ...selectFields(row, ['id', 'actorId', 'action', 'resourceType', 'resourceId', 'outcome']),
    actorName,
    changes: redactStay(redact(row.changes)),
    createdAt: row.createdAt.toISOString(),
  };
}

function buildingScope(ids: string[]): WhereOptions<AuditLogAttributes> {
  return {
    [Op.or]: [
      { resourceType: 'building', resourceId: { [Op.in]: ids } },
      ...['changes.buildingId', 'changes.before.buildingId', 'changes.after.buildingId'].map(
        (field) => ({ [field]: { [Op.in]: ids } }),
      ),
    ],
  };
}

/** Query every supported audit building location through CASL; global entries stay owner-only. */
function scope(user: StayUser): WhereOptions<AuditLogAttributes> {
  if (hasAccess(user, 'read', 'AuditLog')) return {};

  return {
    [Op.or]: [
      {
        [Op.and]: [
          { resourceType: 'building' },
          accessibleWhere(user, 'read', 'AuditLog', { buildingId: 'resourceId' }),
        ],
      },
      ...['changes.buildingId', 'changes.before.buildingId', 'changes.after.buildingId'].map(
        (field) => accessibleWhere(user, 'read', 'AuditLog', { buildingId: field }),
      ),
    ],
  };
}

export async function listAuditLogs(
  user: StayUser,
  query: AuditQuery,
): Promise<{ data: StayAuditLog[]; meta: PaginationMeta }> {
  const conditions: WhereOptions<AuditLogAttributes>[] = [scope(user)];

  if (query.buildingId) conditions.push(buildingScope([query.buildingId]));
  const order: ModelOrder<AuditLogAttributes> = [
    [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
    ['id', 'ASC'],
  ];
  conditions.push(listSearch(AuditLogModel, query.q, ['action', 'resourceType', 'resourceId']));
  if (query.actorId) conditions.push({ actorId: query.actorId });
  if (query.action) conditions.push({ action: query.action });
  if (query.resourceType) conditions.push({ resourceType: query.resourceType });
  if (query.resourceId) conditions.push({ resourceId: query.resourceId });
  if (query.from || query.to) conditions.push({ createdAt: dateRange(query.from, query.to) });
  const where: WhereOptions<AuditLogAttributes> = { [Op.and]: conditions };
  const { rows, count } = await AuditLogModel.findAndCountAll({
    where,
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  const actors = await UserModel.findAll({
    attributes: ['id', 'displayName'],
    where: { id: { [Op.in]: rows.flatMap((row) => (row.actorId ? [row.actorId] : [])) } },
  });
  const names = new Map(actors.map((actor) => [actor.id, actor.displayName]));

  return {
    data: rows.map((row) => auditDto(row, row.actorId ? (names.get(row.actorId) ?? null) : null)),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

export async function getAuditLog(user: StayUser, id: string): Promise<StayAuditLog> {
  const conditions: WhereOptions<AuditLogAttributes>[] = [scope(user)];

  conditions.push({ id });
  const row = await AuditLogModel.findOne({ where: { [Op.and]: conditions } });

  if (!row) throw new NotFound();
  const actor = row.actorId
    ? await UserModel.findByPk(row.actorId, { attributes: ['displayName'] })
    : null;

  return auditDto(row, actor?.displayName ?? null);
}
