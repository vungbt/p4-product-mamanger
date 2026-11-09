import {
  BaseError,
  buildPaginationMeta,
  listSearch,
  NotFound,
  selectFields,
  setAuditChanges,
} from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import type {
  BillingSettings,
  BuildingStats,
  BuildingStatusFilter,
  StayBuilding,
  StayBuildingDetail,
  StayUser,
} from '@stay/shared';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { accessibleBuildingIds, canAccessRecord } from '@/middlewares/ability.middleware.js';
import type { BuildingAttributes } from '@/sequelize/models/building.model.js';
import { BuildingModel } from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import type { ModelOrder } from '@/types/database.js';
import { billingDefaults } from '../settings/settings.service.js';
import { buildingHasInvoices, buildingStats, roomsWithActiveContracts } from './buildings.usage.js';

export type BuildingSortField = 'code' | 'name' | 'createdAt';

export interface BuildingListQuery extends ListQuery<BuildingSortField> {
  status: BuildingStatusFilter;
}

/** Editable fields of a building (`POST`/`PUT /api/buildings`). */
export type BuildingInput = Pick<
  BuildingAttributes,
  | 'code'
  | 'name'
  | 'address'
  | 'readingDay'
  | 'issueDay'
  | 'dueDay'
  | 'roundingUnit'
  | 'refundUnusedRent'
  | 'bankBin'
  | 'bankAccount'
  | 'bankAccountName'
  | 'rulesText'
  | 'contactPhone'
>;

const buildingFields = [
  'id',
  'code',
  'name',
  'address',
  'readingDay',
  'issueDay',
  'dueDay',
  'roundingUnit',
  'refundUnusedRent',
  'bankBin',
  'bankAccount',
  'bankAccountName',
  'rulesText',
  'contactPhone',
  'version',
] satisfies (keyof StayBuilding)[];

function buildingDto(row: BuildingModel, stats: BuildingStats | undefined): StayBuilding {
  return {
    ...selectFields(row, buildingFields),
    archivedAt: row.archivedAt?.toISOString() ?? null,
    stats: stats ?? { roomCount: 0, occupiedRoomCount: 0 },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The building's own billing values, else the system defaults. */
function effectiveBilling(row: BuildingModel, defaults: BillingSettings): BillingSettings {
  return {
    readingDay: row.readingDay ?? defaults.readingDay,
    issueDay: row.issueDay ?? defaults.issueDay,
    dueDay: row.dueDay ?? defaults.dueDay,
    roundingUnit: row.roundingUnit ?? defaults.roundingUnit,
    refundUnusedRent: row.refundUnusedRent ?? defaults.refundUnusedRent,
  };
}

async function detailDto(row: BuildingModel): Promise<StayBuildingDetail> {
  const stats = await buildingStats([row.id]);

  return {
    ...buildingDto(row, stats.get(row.id)),
    billing: effectiveBilling(row, await billingDefaults()),
    codeLocked: await buildingHasInvoices(row.id),
  };
}

/** Buildings `user` may read, filtered and paginated. Managers see their assigned buildings. */
export async function listBuildings(
  user: StayUser,
  query: BuildingListQuery,
): Promise<{ data: StayBuilding[]; meta: PaginationMeta }> {
  const scope = accessibleBuildingIds(user, 'read');
  const conditions: WhereOptions<BuildingAttributes>[] = [];

  if (scope !== 'all') conditions.push({ id: { [Op.in]: scope } });
  if (query.status === 'active') conditions.push({ archivedAt: { [Op.is]: null } });
  if (query.status === 'archived') conditions.push({ archivedAt: { [Op.not]: null } });

  const order: ModelOrder<BuildingAttributes> = [
    [query.sortBy ?? 'code', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
    ['id', 'ASC'],
  ];
  const { rows, count } = await BuildingModel.findAndCountAll({
    where: {
      [Op.and]: [...conditions, listSearch(BuildingModel, query.q, ['code', 'name', 'address'])],
    },
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });
  const stats = await buildingStats(rows.map((row) => row.id));

  return {
    data: rows.map((row) => buildingDto(row, stats.get(row.id))),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

/**
 * A building `user` may `read`/`manage`. Buildings outside the user's scope answer 404 like
 * missing ones, so their existence is not disclosed.
 */
export async function findAccessibleBuilding(
  user: StayUser,
  id: string,
  action: 'read' | 'manage',
  transaction?: Transaction,
): Promise<BuildingModel> {
  const row = canAccessRecord(user, action, 'Building', { buildingId: id })
    ? await BuildingModel.findByPk(id, {
        transaction,
        ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
      })
    : null;

  if (!row) throw new NotFound('building_not_found');
  return row;
}

function assertNotArchived(row: BuildingModel) {
  if (row.archivedAt) throw new BaseError('building_archived', 409, 'building_archived');
}

export async function getBuilding(user: StayUser, id: string): Promise<StayBuildingDetail> {
  return detailDto(await findAccessibleBuilding(user, id, 'read'));
}

export async function createBuilding(input: BuildingInput): Promise<StayBuildingDetail> {
  return auditedTransaction(async (transaction) => {
    const row = await BuildingModel.create({ ...input }, { transaction });

    setAuditChanges({ after: selectFields(row, buildingFields) });
    return detailDto(row);
  });
}

export async function updateBuilding(
  user: StayUser,
  id: string,
  input: BuildingInput,
  expectedVersion: number,
): Promise<StayBuildingDetail> {
  return auditedTransaction(async (transaction) => {
    const row = await findAccessibleBuilding(user, id, 'manage', transaction);

    assertNotArchived(row);
    assertVersion(row.version, expectedVersion);

    const before = selectFields(row, buildingFields);

    await row.update({ ...input }, { transaction });
    setAuditChanges({ before, after: selectFields(row, buildingFields) });
    return detailDto(row);
  });
}

/** Archive a building; refused (409, with the rooms) while a room has an active contract. */
export async function archiveBuilding(user: StayUser, id: string): Promise<StayBuildingDetail> {
  return auditedTransaction(async (transaction) => {
    const row = await findAccessibleBuilding(user, id, 'manage', transaction);

    assertNotArchived(row);

    const rooms = await roomsWithActiveContracts(row.id, transaction);

    if (rooms.length)
      throw new BaseError('building_has_active_contracts', 409, 'building_has_active_contracts', {
        rooms: rooms.map((room) => ({ ...room })),
      });

    await row.update({ archivedAt: new Date() }, { transaction });
    setAuditChanges({ archivedAt: row.archivedAt?.toISOString() ?? null, code: row.code });
    return detailDto(row);
  });
}
