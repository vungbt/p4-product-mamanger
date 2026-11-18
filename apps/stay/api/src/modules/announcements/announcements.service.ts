/**
 * ST-25 O-32: building announcements for tenants. Staff with `update Building` (owner; managers
 * in assigned buildings) write them; the portal (T-03/T-10) shows the unexpired ones of the
 * whole building or the contract's room. Out of scope → 404.
 */
import { buildPaginationMeta, NotFound, searchPattern } from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import type {
  AnnouncementDeleteResult,
  AnnouncementInput,
  AnnouncementStatus,
  StayAnnouncement,
  StayUser,
} from '@stay/shared';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { accessibleBuildingIds, canAccessRecord } from '@/middlewares/ability.middleware.js';
import { accessibleWhere } from '@/middlewares/accessible-where.js';
import type { AnnouncementAttributes } from '@/sequelize/models/announcement.model.js';
import { AnnouncementModel, RoomModel, UserModel } from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import type { ModelOrder } from '@/types/database.js';
import { notifyAnnouncement } from '../notifications/notifications.events.js';
import { invalid } from '../requests/requests.shared.js';

export type AnnouncementSortField = 'createdAt' | 'expiresAt';

export interface AnnouncementListQuery extends ListQuery<AnnouncementSortField> {
  buildingId?: string;
  status: AnnouncementStatus;
}

/** Shown through the whole last day (Asia/Ho_Chi_Minh, UTC+7 without DST). */
const expiresAtOf = (expiresOn: string | null | undefined) =>
  expiresOn ? new Date(`${expiresOn}T23:59:59.999+07:00`) : null;

async function dtos(rows: AnnouncementModel[], transaction?: Transaction) {
  const roomIds = [...new Set(rows.flatMap((row) => row.roomIds ?? []))];
  const userIds = [...new Set(rows.flatMap((row) => (row.createdBy ? [row.createdBy] : [])))];
  const [rooms, users] = await Promise.all([
    roomIds.length
      ? RoomModel.findAll({
          where: { id: { [Op.in]: roomIds } },
          attributes: ['id', 'code'],
          transaction,
        })
      : [],
    userIds.length
      ? UserModel.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ['id', 'displayName'],
          transaction,
        })
      : [],
  ]);
  const roomCode = new Map(rooms.map((room) => [room.id, room.code]));
  const userName = new Map(users.map((user) => [user.id, user.displayName]));
  const now = Date.now();

  return rows.map(
    (row): StayAnnouncement => ({
      id: row.id,
      buildingId: row.buildingId,
      title: row.title,
      body: row.body,
      roomIds: row.roomIds,
      roomCodes: (row.roomIds ?? []).map((id) => roomCode.get(id) ?? ''),
      pinned: row.pinned,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      expired: Boolean(row.expiresAt && row.expiresAt.getTime() <= now),
      createdByName: row.createdBy ? (userName.get(row.createdBy) ?? null) : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: row.version,
    }),
  );
}

async function dto(row: AnnouncementModel, transaction?: Transaction) {
  const [item] = await dtos([row], transaction);

  if (!item) throw new NotFound();
  return item;
}

function assertBuilding(user: StayUser, buildingId: string) {
  if (!canAccessRecord(user, 'update', 'Building', { buildingId }))
    throw new NotFound('building_not_found');
}

async function findAnnouncement(user: StayUser, id: string, transaction: Transaction) {
  const row = await AnnouncementModel.findOne({
    where: { [Op.and]: [{ id }, accessibleWhere(user, 'update', 'Building')] },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!row || !canAccessRecord(user, 'update', 'Building', { buildingId: row.buildingId }))
    throw new NotFound();
  return row;
}

/** Targeted rooms must belong to the building (archived rooms are refused). */
async function assertRooms(input: AnnouncementInput, transaction: Transaction) {
  const ids = input.roomIds ?? [];

  if (!ids.length) return;
  const found = await RoomModel.count({
    where: { id: { [Op.in]: ids }, buildingId: input.buildingId, archivedAt: null },
    transaction,
  });

  if (found !== ids.length) invalid('roomIds', 'Chỉ chọn phòng đang hoạt động của toà.');
}

/** Audit facts: ids, targeting, pin and expiry only (never the title or body). */
async function audit(action: string, row: AnnouncementModel, transaction: Transaction) {
  await recordAudit(
    {
      action: `announcement.${action}`,
      resourceType: 'announcement',
      resourceId: row.id,
      changes: {
        buildingId: row.buildingId,
        announcementId: row.id,
        roomCount: row.roomIds?.length ?? null,
        pinned: row.pinned,
        expiresAt: row.expiresAt?.toISOString() ?? null,
        version: row.version,
      },
    },
    transaction,
  );
}

/** `GET /api/announcements` (O-32): pinned first, then newest. */
export async function listAnnouncements(
  user: StayUser,
  query: AnnouncementListQuery,
): Promise<{ data: StayAnnouncement[]; meta: PaginationMeta }> {
  if (query.buildingId) assertBuilding(user, query.buildingId);
  const scope = accessibleBuildingIds(user, 'update');
  const conditions: WhereOptions<AnnouncementAttributes>[] = [
    accessibleWhere(user, 'update', 'Building'),
  ];
  const now = new Date();

  if (scope !== 'all') conditions.push({ buildingId: { [Op.in]: scope } });
  if (query.buildingId) conditions.push({ buildingId: query.buildingId });
  if (query.status === 'active')
    conditions.push({ [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }] });
  if (query.status === 'expired') conditions.push({ expiresAt: { [Op.lte]: now } });
  if (query.q) {
    const pattern = searchPattern(query.q);

    conditions.push({
      [Op.or]: [{ title: { [Op.iLike]: pattern } }, { body: { [Op.iLike]: pattern } }],
    });
  }
  const direction = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const order: ModelOrder<AnnouncementAttributes> = [
    ['pinned', 'DESC'],
    [query.sortBy ?? 'createdAt', direction],
    ['id', 'ASC'],
  ];
  const { rows, count } = await AnnouncementModel.findAndCountAll({
    where: { [Op.and]: conditions },
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: await dtos(rows),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

/** `POST /api/announcements`. */
export async function createAnnouncement(
  user: StayUser,
  input: AnnouncementInput,
): Promise<StayAnnouncement> {
  assertBuilding(user, input.buildingId);

  return auditedTransaction(async (transaction) => {
    await assertRooms(input, transaction);
    const row = await AnnouncementModel.create(
      {
        buildingId: input.buildingId,
        title: input.title,
        body: input.body,
        roomIds: input.roomIds?.length ? input.roomIds : null,
        pinned: input.pinned ?? false,
        expiresAt: expiresAtOf(input.expiresOn),
        createdBy: user.id,
      },
      { transaction },
    );

    await audit('created', row, transaction);
    await notifyAnnouncement(row, transaction);
    return dto(row, transaction);
  });
}

/** `PUT /api/announcements/:id` (`version`); the building cannot change. */
export async function updateAnnouncement(
  user: StayUser,
  id: string,
  input: AnnouncementInput,
  version: number,
): Promise<StayAnnouncement> {
  return auditedTransaction(async (transaction) => {
    const row = await findAnnouncement(user, id, transaction);

    assertVersion(row.version, version);
    if (input.buildingId !== row.buildingId)
      invalid('buildingId', 'Không đổi được toà của thông báo.');
    await assertRooms(input, transaction);
    await row.update(
      {
        title: input.title,
        body: input.body,
        roomIds: input.roomIds?.length ? input.roomIds : null,
        pinned: input.pinned ?? false,
        expiresAt: expiresAtOf(input.expiresOn),
      },
      { transaction },
    );
    await audit('updated', row, transaction);
    return dto(row, transaction);
  });
}

/** `POST /api/announcements/:id/archive`: hidden from tenants now (expires now, unpinned). */
export async function archiveAnnouncement(user: StayUser, id: string): Promise<StayAnnouncement> {
  return auditedTransaction(async (transaction) => {
    const row = await findAnnouncement(user, id, transaction);
    const now = new Date();

    if (!row.expiresAt || row.expiresAt > now)
      await row.update({ expiresAt: now, pinned: false }, { transaction });
    await audit('archived', row, transaction);
    return dto(row, transaction);
  });
}

/** `DELETE /api/announcements/:id`: removes it for good. */
export async function deleteAnnouncement(
  user: StayUser,
  id: string,
): Promise<AnnouncementDeleteResult> {
  return auditedTransaction(async (transaction) => {
    const row = await findAnnouncement(user, id, transaction);

    await audit('deleted', row, transaction);
    await row.destroy({ transaction });
    return { id, deleted: true };
  });
}
